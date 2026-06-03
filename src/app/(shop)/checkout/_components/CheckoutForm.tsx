'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Separator } from '@/presentation/components/ui/separator';
import { createOrderAction } from '../actions';
import { ShippingAddressFields } from './ShippingAddressFields';
import { OrderSummary, type OrderSummaryItem } from './OrderSummary';

/**
 * Shipping address schema — mirrored from the server action so RHF can
 * validate the form on every keystroke. The server re-validates with
 * the same shape; the client schema is for UX only.
 */
const SHIPPING_ADDRESS_SCHEMA = z.object({
  fullName: z.string().min(2, 'Ingresa tu nombre completo').max(120),
  phone: z.string().min(7, 'Ingresa un teléfono válido').max(40),
  email: z.string().email('Email inválido').max(160),
  street: z.string().min(5, 'Ingresa la dirección').max(200),
  city: z.string().min(2, 'Ingresa la ciudad').max(80),
  state: z.string().min(2, 'Ingresa el departamento').max(80),
  zipCode: z.string().min(3, 'Ingresa el código postal').max(20),
});

export type CheckoutFormValues = z.infer<typeof SHIPPING_ADDRESS_SCHEMA>;

interface CheckoutFormProps {
  summary: {
    items: OrderSummaryItem[];
    total: number;
    itemCount: number;
  };
  defaults?: Partial<CheckoutFormValues>;
}

/**
 * Checkout form (Phase 4, C).
 *
 * Uses react-hook-form + zod because this is a 7-field form — that
 * is exactly the case where RHF beats `useFormState`. The server
 * action is async; we call it from the submit handler.
 *
 * On success: `window.location.href = result.url` to redirect to
 * Wompi. We use a full navigation (not `router.push`) because Wompi
 * is a third-party domain and the user must leave the app.
 */
export function CheckoutForm({ summary, defaults }: CheckoutFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<CheckoutFormValues>({
    resolver: zodResolver(SHIPPING_ADDRESS_SCHEMA),
    defaultValues: {
      fullName: defaults?.fullName ?? '',
      email: defaults?.email ?? '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = methods.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = await createOrderAction(values);
      if (!result.ok) {
        const message = messageForError(result.error);
        setError(message);
        toast.error(message);
        if (result.error === 'AUTH_REQUIRED') {
          router.push('/login?next=%2Fcheckout');
        }
        return;
      }
      // Hand off to Wompi. A full navigation (window.location.href)
      // is the right tool here: Wompi is a third-party domain and
      // router.push would only work for in-app routes.
      window.location.href = result.url;
    });
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label="Formulario de envío y pago"
        className="grid gap-8 lg:grid-cols-[1fr_360px]"
      >
        <section aria-label="Datos de envío" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dirección de envío</CardTitle>
              <p className="text-sm text-muted-foreground">
                Te enviaremos el pedido a esta dirección.
              </p>
            </CardHeader>
            <CardContent>
              <ShippingAddressFields />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Método de pago</CardTitle>
              <p className="text-sm text-muted-foreground">
                Al hacer clic en <span className="font-medium">Pagar con Wompi</span> serás
                redirigido a la pasarela de pago para completar la transacción de forma segura.
              </p>
            </CardHeader>
            <CardContent>
              <div className="border-border/60 bg-muted/30 flex items-center gap-3 rounded-md border p-3 text-sm">
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <p className="text-muted-foreground">
                  Pagos procesados por Wompi. Acepta PSE, Nequi, Bancolombia y tarjetas de
                  crédito/débito.
                </p>
              </div>
            </CardContent>
          </Card>

          {error ? (
            <div
              role="alert"
              className="border-destructive/40 bg-destructive/10 rounded-md border p-3 text-sm text-destructive"
            >
              {error}
            </div>
          ) : null}
        </section>

        <OrderSummary items={summary.items} total={summary.total} />

        <div className="lg:col-span-2">
          <Separator className="my-2" />
          <div className="mt-4 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Al pagar aceptas nuestros términos y condiciones. El cargo se realizará en pesos
              colombianos (COP).
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="w-full sm:w-auto sm:min-w-[16rem]"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Creando orden...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  Pagar con Wompi
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

function messageForError(code: string): string {
  switch (code) {
    case 'AUTH_REQUIRED':
      return 'Tu sesión expiró. Inicia sesión de nuevo para continuar.';
    case 'EMPTY_CART':
      return 'Tu carrito está vacío. Agrega productos antes de pagar.';
    case 'OUT_OF_STOCK':
      return 'Uno o más productos no tienen stock suficiente. Vuelve al carrito para revisar.';
    case 'NOT_FOUND':
      return 'Uno de los productos ya no está disponible. Vuelve al carrito para revisar.';
    case 'INVALID_INPUT':
      return 'Revisa los datos del formulario. Algún campo no es válido.';
    case 'MISSING_ENV':
      return 'La pasarela de pago no está configurada. Contacta al administrador.';
    default:
      return 'No pudimos crear la orden. Intenta de nuevo en unos segundos.';
  }
}
