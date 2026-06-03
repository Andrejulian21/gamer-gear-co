import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { SEED_PRODUCT_SLUG, SEED_PRODUCT_SLUG_2 } from './fixtures/products';

test.describe('Cart flow', () => {
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
    await loginAs(page, 'juan@example.com', 'User1234!');
    await page.goto(`/products/${SEED_PRODUCT_SLUG}`);

    const addButton = page.getByRole('button', { name: /Agregar.*al carrito/i });
    const cartLink = page.getByRole('link', { name: /Ver carrito/i });

    await addButton.click();

    // No error toast surfaced
    await expect(page.getByRole('alert')).toHaveCount(0);

    // Badge shows 1
    await expect(cartLink).toContainText('1');

    // Add same product again — badge should bump to 2
    await addButton.click();
    await expect(cartLink).toContainText('2');
  });

  test('logged-in user can update quantity and remove item from the cart page', async ({
    page,
  }) => {
    await loginAs(page, 'juan@example.com', 'User1234!');
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
    await loginAs(page, 'juan@example.com', 'User1234!');
    await page.goto(`/products/${SEED_PRODUCT_SLUG_2}`);

    // The quantity stepper exposes + / - buttons; the visible quantity
    // must be capped by the product's stock. Try to push past the cap
    // by spamming + — the button should disable at the cap and the
    // quantity must never grow beyond it.
    const increase = page.getByRole('button', { name: /Aumentar cantidad/i });
    const quantity = page.getByLabel(/Cantidad:/);

    let lastValue = 0;
    for (let i = 0; i < 500; i++) {
      if (await increase.isDisabled()) break;
      await increase.click();
      const text = (await quantity.textContent())?.trim() ?? '';
      const parsed = Number.parseInt(text, 10);
      expect(parsed).toBeGreaterThan(lastValue); // monotonic
      lastValue = parsed;
    }

    // The + control must be disabled at the cap
    await expect(increase).toBeDisabled();
    // And a final spam click must not push the value past the cap
    const cap = lastValue;
    await increase.click({ force: true }).catch(() => {
      /* disabled buttons reject clicks */
    });
    const finalText = (await quantity.textContent())?.trim() ?? '';
    expect(Number.parseInt(finalText, 10)).toBeLessThanOrEqual(cap);
  });
});
