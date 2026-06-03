/**
 * Skip-to-content link (WCAG 2.4.1 Bypass Blocks).
 *
 * Visually hidden until the user tabs to it (keyboard navigation).
 * When focused, the link appears at the top-left of the viewport and
 * jumps focus to the `<main id="main-content">` element.
 *
 * The target element is rendered by the root layout (`src/app/layout.tsx`).
 * We intentionally keep the focus-ring visible (focus-visible) so screen
 * reader + keyboard users get a clear landing spot.
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      Saltar al contenido principal
    </a>
  );
}
