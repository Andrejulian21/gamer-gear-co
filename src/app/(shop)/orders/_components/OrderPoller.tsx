'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface OrderPollerProps {
  orderId: string;
  initialStatus: string;
}

/**
 * Status poller for the order detail page.
 *
 * Race condition: the user is redirected back from Wompi BEFORE
 * the webhook has fired. If the page rendered once with status
 * PENDING and never updated, the user would see a "still pending"
 * order even though the webhook is about to mark it PAID.
 *
 * Strategy:
 *  - On mount: if status === PENDING, start a 5s interval that
 *    calls `router.refresh()`. router.refresh re-runs the server
 *    component, re-reads the order, and re-renders the page.
 *  - Stop polling after 12 ticks (60s) OR when the server-rendered
 *    status is no longer PENDING.
 *  - On the transition PENDING -> PAID, surface a success toast.
 *    On the transition PENDING -> FAILED, surface an error toast.
 *  - On stop with still PENDING, surface an info toast explaining
 *    that the user will receive an email when payment is confirmed.
 *
 * The poller also surfaces a Wompi-redirect success toast on initial
 * mount if the URL has `?status=APPROVED` (defensive — the actual
 * Wompi redirect appends `?id=<tx>` but the URL may also be opened
 * with `?status=APPROVED` from internal flows).
 *
 * Renders a hidden `<span data-testid="order-poller">` so E2E tests
 * can wait for the poller element to appear in the DOM and assert
 * status transitions.
 */
export function OrderPoller({ orderId, initialStatus }: OrderPollerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(initialStatus);
  const [pollCount, setPollCount] = useState(0);
  const hasFiredWompiToastRef = useRef(false);
  const hasFiredTransitionToastRef = useRef(false);

  // Detect a Wompi redirect (id=<tx> is Wompi's actual format).
  const wompiTxId = searchParams.get('id');
  const wompiStatus = searchParams.get('status');
  const isWompiRedirect = Boolean(wompiTxId) || wompiStatus === 'APPROVED';

  // Surface the success toast on the very first render when the
  // server already confirms PAID and we were redirected from Wompi.
  useEffect(() => {
    if (hasFiredWompiToastRef.current) return;
    if (isWompiRedirect && status === 'PAID') {
      toast.success('Pago confirmado. Tu pedido está en marcha.');
      hasFiredWompiToastRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling loop — only runs while PENDING.
  useEffect(() => {
    if (status !== 'PENDING') return;
    if (pollCount >= 12) {
      if (!hasFiredTransitionToastRef.current) {
        toast.info('Recibirás un email cuando se confirme el pago.');
        hasFiredTransitionToastRef.current = true;
      }
      return;
    }

    const timeoutId = setTimeout(() => {
      setPollCount((c) => c + 1);
      router.refresh();
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [pollCount, status, router]);

  // When the parent re-renders with a new status (via router.refresh),
  // detect the transition and surface a toast.
  useEffect(() => {
    if (hasFiredTransitionToastRef.current) return;
    if (status === 'PENDING') return;
    if (isWompiRedirect) {
      // The Wompi-redirect toast will fire on the first PAID render.
      // Skip the transition toast to avoid double-firing.
      if (status === 'PAID') {
        hasFiredTransitionToastRef.current = true;
        return;
      }
    }
    if (status === 'PAID') {
      toast.success('Pago confirmado. Tu pedido está en marcha.');
    } else if (status === 'FAILED') {
      toast.error('El pago fue rechazado. Intenta de nuevo desde Mis pedidos.');
    }
    hasFiredTransitionToastRef.current = true;
  }, [status, isWompiRedirect]);

  // When the server re-renders the parent with a new status, sync
  // it into our local state. (The parent's `initialStatus` prop
  // changes on each refresh.)
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  return (
    <span
      aria-hidden="true"
      data-testid="order-poller"
      data-order-id={orderId}
      data-status={status}
      className="hidden"
    />
  );
}
