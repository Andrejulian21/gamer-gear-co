/**
 * Wompi webhook POST route.
 *
 * Surface for receiving payment events from Wompi. Three jobs:
 *
 *   1. Authenticate the request via signature (HMAC-style SHA256).
 *   2. Map the Wompi event shape to our `processPaymentResult` input.
 *   3. Return 200 on every legitimate Wompi delivery — even no-ops and
 *      events we don't care about — so Wompi does not retry forever.
 *
 * Security contract (CRITICAL — webhook spoofing = stolen revenue):
 *
 *   - The RAW request body MUST feed the signature verifier. Parsing
 *     to JSON and re-serializing changes whitespace / key order and
 *     will produce a different hash than the one Wompi computed. We
 *     use `request.text()` here and parse manually afterwards.
 *   - `WOMPI_EVENTS_SECRET` is the server-only secret used for
 *     verification. Missing secret -> 500 (config error). Never echo
 *     the secret in logs or responses.
 *   - `X-Request-Timestamp` and `X-Signature` headers are mandatory.
 *     Missing either -> 400.
 *   - Invalid signature OR stale timestamp (>5 min away from now) ->
 *     401. The verifier (`verifyWompiWebhookSignature`) rejects both
 *     in one call; we deliberately do NOT distinguish "bad sig" from
 *     "stale ts" in the response to avoid leaking which check failed.
 *   - Stack traces are NEVER returned to the caller. A generic
 *     `{ ok: true }` (200) or `{ error: 'invalid_signature' }` (401)
 *     is all Wompi sees. Detail lives in server logs only.
 *
 * Status mapping (Wompi -> our domain):
 *   APPROVED            -> 'APPROVED'  (transition PENDING -> PAID)
 *   DECLINED / VOIDED / -> 'DECLINED'  (transition PENDING -> FAILED)
 *   ERROR
 *   PENDING             -> ignored, return 200 (not a state transition)
 *
 * Idempotency: handled by the use case. If Wompi re-delivers the same
 * APPROVED event, the order is already PAID and the use case returns
 * it unchanged. We still respond 200.
 *
 * Runtime: `nodejs` (NOT edge) — we need Node's `crypto` for signature
 * verification AND Prisma client. Edge runtime supports neither.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { verifyWompiWebhookSignature } from '@/infrastructure/payments/verify-webhook';
import { wompiWebhookHandler } from '@/infrastructure/payments/wompi-webhook-handler';
import { getOrderDeps } from '@/presentation/lib/order-deps';
import type { PaymentStatus } from '@/domain/use-cases/orders/ProcessPaymentResult';

export const runtime = 'nodejs';
// Webhook payloads must NEVER be cached.
export const dynamic = 'force-dynamic';

const TIMESTAMP_HEADER = 'x-request-timestamp';
const SIGNATURE_HEADER = 'x-signature';
const EXPECTED_EVENT = 'transaction.updated';

/**
 * Wompi transaction status values we know about. We accept unknown
 * values gracefully (logged + ignored) instead of crashing — Wompi
 * may add new statuses without warning.
 */
type WompiTransactionStatus = 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED' | 'PENDING';

interface WompiWebhookPayload {
  event?: string;
  data?: {
    transaction?: {
      id?: string;
      status?: string;
      reference?: string;
    };
  };
}

/**
 * Map a raw Wompi status string to either:
 *   - a payment status we should forward to the use case, OR
 *   - `null` meaning "no state transition" (e.g. PENDING).
 *
 * Unknown statuses also return `null` — we log and ignore rather than
 * making a guess about how to map them.
 */
const mapWompiStatus = (raw: string | undefined): PaymentStatus | null => {
  const s = (raw ?? '').toUpperCase() as WompiTransactionStatus;
  switch (s) {
    case 'APPROVED':
      return 'APPROVED';
    case 'DECLINED':
    case 'VOIDED':
    case 'ERROR':
      return 'DECLINED';
    case 'PENDING':
      return null;
    default:
      return null;
  }
};

/**
 * Read the raw request body without consuming it twice. Next.js gives
 * us a `Request` whose `.text()` resolves to the raw UTF-8 body — the
 * exact string Wompi signed. DO NOT use `.json()` here.
 */
const readRawBody = (request: NextRequest): Promise<string> => request.text();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret) {
    // Config error: refuse to process anything without a verification
    // secret. 500 is correct here — Wompi will retry, and meanwhile
    // we'll see the error in logs.
    console.error('[wompi-webhook] WOMPI_EVENTS_SECRET is not configured');
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
  }

  const timestampHeader = request.headers.get(TIMESTAMP_HEADER);
  const signatureHeader = request.headers.get(SIGNATURE_HEADER);

  if (!timestampHeader || !signatureHeader) {
    return NextResponse.json({ error: 'missing_signature_headers' }, { status: 400 });
  }

  // Raw body MUST be read BEFORE parsing — and used as-is in the verifier.
  const rawBody = await readRawBody(request);

  const isValid = verifyWompiWebhookSignature({
    signature: signatureHeader,
    timestamp: timestampHeader,
    body: rawBody,
    secret,
  });

  if (!isValid) {
    // Don't distinguish "bad signature" from "stale timestamp" in the
    // response — both mean "we won't trust this delivery".
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  // Signature is good. Parse the body (we now know it's the same bytes
  // Wompi signed, so parsing is safe).
  let payload: WompiWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WompiWebhookPayload;
  } catch {
    // Malformed JSON after a valid signature is unexpected. Treat as
    // a 400 — don't 500 (would cause infinite retries).
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (payload.event !== EXPECTED_EVENT) {
    // Unknown / unrelated event. Acknowledge and ignore.
    return NextResponse.json({ ok: true, ignored: 'event_type' }, { status: 200 });
  }

  const transaction = payload.data?.transaction;
  const wompiReference = transaction?.reference;
  const wompiStatus = transaction?.status;
  const transactionId = transaction?.id;

  if (!wompiReference) {
    // Wompi sent a transaction.updated without a reference. Either a
    // malformed payload or an internal Wompi test event. 200 + log.
    console.warn('[wompi-webhook] transaction.updated without reference');
    return NextResponse.json({ ok: true, ignored: 'missing_reference' }, { status: 200 });
  }

  const paymentStatus = mapWompiStatus(wompiStatus);
  if (paymentStatus === null) {
    // PENDING or unknown status. Not a state transition.
    return NextResponse.json(
      { ok: true, ignored: 'non_transitional_status', status: wompiStatus },
      { status: 200 },
    );
  }

  // Hand off to the business-logic handler (opens the Prisma transaction
  // and applies the use case).
  try {
    const deps = getOrderDeps();
    const result = await wompiWebhookHandler(
      { wompiReference, paymentStatus, transactionId },
      {
        orderRepository: deps.orderRepository,
        productRepository: deps.productRepository,
        cartRepository: deps.cartRepository,
        prisma: deps.prisma,
      },
    );

    if (!result.ok) {
      console.warn(
        `[wompi-webhook] order not found for reference=${result.wompiReference} — acknowledging anyway`,
      );
      return NextResponse.json({ ok: true, ignored: 'order_not_found' }, { status: 200 });
    }

    console.info(
      `[wompi-webhook] processed reference=${result.wompiReference} status=${result.status}`,
    );
    return NextResponse.json({ ok: true, status: result.status }, { status: 200 });
  } catch (err) {
    // Any unexpected error: log full detail server-side, return generic
    // 500 to caller. Wompi will retry, which is what we want for
    // genuinely transient failures.
    console.error('[wompi-webhook] unexpected error processing event', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
