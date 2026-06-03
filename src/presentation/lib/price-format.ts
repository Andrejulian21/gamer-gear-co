/**
 * Formats a number as Colombian Pesos (COP).
 *
 * Uses dot as thousands separator and the "COP" suffix.
 * Example: 450000 -> "$ 450.000 COP"
 *
 * Accepts plain numbers or anything that has a toNumber() method
 * (compatible with Prisma Decimal) to keep the call site simple.
 */
export type PriceInput = number | { toNumber: () => number };

export function formatCOP(price: PriceInput): string {
  const value = typeof price === 'number' ? price : price.toNumber();
  const safe = Number.isFinite(value) ? value : 0;

  const formatted = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(safe);

  return `$ ${formatted} COP`;
}
