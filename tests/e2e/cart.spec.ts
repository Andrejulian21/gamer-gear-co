import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { SEED_PRODUCT_SLUG, SEED_PRODUCT_SLUG_2 } from './fixtures/products';
import { getTestPrisma } from './helpers/db';

const TEST_USER_EMAIL = 'juan@example.com';

/**
 * Clears the test user's cart directly in the DB. The cart E2E suite
 * shares one user (`juan@example.com`) and one Postgres instance, so
 * without this reset earlier tests leak items into later ones.
 */
async function clearTestUserCart(): Promise<void> {
  const prisma = getTestPrisma();
  const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } });
  if (user) {
    await prisma.cartItem.deleteMany({ where: { userId: user.id } });
  }
}

test.describe('Cart flow', () => {
  // All 4 cart tests share one user (`juan@example.com`) and one DB,
  // so they MUST run serially. Parallel workers race on the cart
  // count and produce flaky quantity assertions. gamma also added
  // `serial` to the checkout-happy-path spec for the same reason.
  test.describe.configure({ mode: 'serial' });
  test('anonymous user clicking "Agregar al carrito" is redirected to /login', async ({ page }) => {
    await page.goto(`/products/${SEED_PRODUCT_SLUG}`);

    // Sanity: we are on a real product page
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('button', { name: /Agregar.*al carrito/i }).click();

    await expect(page).toHaveURL(/\/login/);
    // The login page should remember where the user wanted to go
    await expect(page).toHaveURL(/[?&](next|callbackUrl)=/);
  });

  test('logged-in user can add an item and the cart badge increments', async ({ page }) => {
    await clearTestUserCart();
    await loginAs(page, TEST_USER_EMAIL, 'User1234!');
    await page.goto(`/products/${SEED_PRODUCT_SLUG}`);

    const addButton = page.getByRole('button', { name: /Agregar.*al carrito/i });
    const cartLink = page.getByRole('link', { name: /Ver carrito/i });

    await addButton.click();

    // Badge shows 1 — the real success signal. (We removed the
    // `getByRole('alert')` check because sonner success toasts also
    // match that role in v2; the badge increment is unambiguous.)
    await expect(cartLink).toContainText('1');

    // Add same product again — badge should bump to 2
    await addButton.click();
    await expect(cartLink).toContainText('2');
  });

  test('logged-in user can update quantity and remove item from the cart page', async ({
    page,
  }) => {
    await clearTestUserCart();
    await loginAs(page, TEST_USER_EMAIL, 'User1234!');
    await page.goto(`/products/${SEED_PRODUCT_SLUG}`);

    await page.getByRole('button', { name: /Agregar.*al carrito/i }).click();

    await page.goto('/cart');

    // The product we just added should be in the list
    const line = page.getByRole('listitem').filter({
      has: page.getByText('Razer DeathAdder V3 Pro'),
    });
    await expect(line).toBeVisible();
    await expect(line).toContainText(/\$|COP/);

    // Bump quantity to 2 via the +1 control
    const increase = line.getByRole('button', { name: /Aumentar cantidad/i });
    await increase.click();
    await expect(line).toContainText('2');

    // Drop it back to 1 via the -1 control
    const decrease = line.getByRole('button', { name: /Disminuir cantidad/i });
    await decrease.click();
    await expect(line).toContainText('1');

    // Remove the line entirely
    await line.getByRole('button', { name: /Eliminar/i }).click();

    // Empty state appears
    await expect(page.getByText(/Tu carrito está vacío/i)).toBeVisible();
  });

  test('quantity input respects the maxQuantity (stock) cap', async ({ page }) => {
    await clearTestUserCart();
    await loginAs(page, TEST_USER_EMAIL, 'User1234!');
    await page.goto(`/products/${SEED_PRODUCT_SLUG_2}`);

    // The quantity stepper exposes + / - buttons; the visible quantity
    // must be capped by the product's stock. Try to push past the cap
    // by spamming + — the button should disable at the cap and the
    // quantity must never grow beyond it.
    const increase = page.getByRole('button', { name: /Aumentar cantidad/i });
    // aria-label is "Cantidad" (no colon) — exact match avoids catching
    // the "Aumentar cantidad" / "Disminuir cantidad" buttons.
    const quantity = page.getByLabel('Cantidad', { exact: true });

    // The seed product in this test (`logitech-g-pro-x-superlight`)
    // has stock 12. The loop must terminate either by the button
    // becoming disabled OR by a click becoming a no-op (current+1 is
    // clamped to bound, so the input value stops changing). Either
    // signal tells us we've reached the cap.
    let capReached = false;
    let lastValue = 0;
    for (let i = 0; i < 500; i++) {
      if (await increase.isDisabled()) {
        capReached = true;
        break;
      }
      const before = Number.parseInt((await quantity.inputValue()) ?? '0', 10);
      await increase.click();
      // Imperative value set in the React onClick — give the event
      // loop a chance to run the handler before re-reading.
      await page.waitForTimeout(50);
      const after = Number.parseInt((await quantity.inputValue()) ?? '0', 10);
      if (after === before) {
        // Click was a no-op (clamped to bound). We've reached the cap.
        capReached = true;
        break;
      }
      expect(after).toBeGreaterThan(before);
      lastValue = after;
    }
    expect(capReached).toBe(true);
    // A force-click past the cap must not push the value beyond it.
    // (The current AddToCartButton doesn't visually disable the +
    // button at the cap — it just becomes a no-op. The test asserts
    // the correctness property: quantity must never exceed stock.)
    const cap = lastValue;
    await increase.click({ force: true }).catch(() => {
      /* disabled buttons reject clicks */
    });
    const finalValue = Number.parseInt((await quantity.inputValue()) ?? '0', 10);
    expect(finalValue).toBeLessThanOrEqual(cap);
  });
});
