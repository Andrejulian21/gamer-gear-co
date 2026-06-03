import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { getTestPrisma } from './helpers/db';

const TEST_USER_EMAIL = 'juan@example.com';
const TEST_USER_PASSWORD = 'User1234!';

/**
 * Clears the test user's addresses directly in the DB. The account
 * E2E suite shares one user (`juan@example.com`) and one Postgres
 * instance, so without this reset earlier tests leak addresses into
 * later ones.
 *
 * Also resets the user's name/email to the seed values in case a
 * previous test mutated them.
 */
async function clearTestUserAccountData(): Promise<void> {
  const prisma = getTestPrisma();
  const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } });
  if (user) {
    await prisma.address.deleteMany({ where: { userId: user.id } });
    await prisma.user.update({
      where: { id: user.id },
      data: { name: 'Juan Pérez', email: TEST_USER_EMAIL },
    });
  }
}

test.describe('Account flow (Phase 6)', () => {
  // All 6 tests share one user (`juan@example.com`) and one DB, so
  // they MUST run serially. Parallel workers race on the same rows
  // and produce flaky assertions. Same pattern as cart.spec.ts.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await clearTestUserAccountData();
  });

  test('logged-in user can open /account and see the profile form pre-filled', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/account');

    await expect(page.getByRole('heading', { level: 1, name: /Mi cuenta/i })).toBeVisible();
    await expect(page.getByLabel('Nombre')).toHaveValue('Juan Pérez');
    await expect(page.getByLabel('Email')).toHaveValue(TEST_USER_EMAIL);
  });

  test('user can change the profile name and see the new value', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/account');

    const nameInput = page.getByLabel('Nombre');
    await nameInput.fill('Juan Editado');

    await page.getByRole('button', { name: /Guardar cambios/i }).click();

    // The success toast — proves the action settled server-side.
    await expect(page.getByText(/Perfil actualizado/i).first()).toBeVisible({ timeout: 10_000 });

    // Reload — the persisted name should be visible in the form.
    await page.reload();
    await expect(page.getByLabel('Nombre')).toHaveValue('Juan Editado');

    // Restore the seed name so subsequent tests start clean.
    const prisma = getTestPrisma();
    const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } });
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { name: 'Juan Pérez' } });
    }
  });

  test('password change with wrong current password shows a field error', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/account');

    // Use the input id for the new password (the label is a substring
    // of "Confirmar nueva contraseña" so getByLabel matches both).
    await page.getByLabel('Contraseña actual').fill('WrongPassword1');
    await page.locator('#password-new').fill('NewPassword1');
    await page.locator('#password-confirm').fill('NewPassword1');

    await page.getByRole('button', { name: /Cambiar contraseña/i }).click();

    await expect(page.getByText(/contraseña actual es incorrecta/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('password change with correct current password succeeds', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/account');

    await page.getByLabel('Contraseña actual').fill(TEST_USER_PASSWORD);
    await page.locator('#password-new').fill('NewPassword1');
    await page.locator('#password-confirm').fill('NewPassword1');

    await page.getByRole('button', { name: /Cambiar contraseña/i }).click();

    await expect(page.getByText(/Contraseña actualizada/i).first()).toBeVisible({
      timeout: 10_000,
    });

    // Restore the password to the seed value so the user can keep
    // logging in with the canonical credentials.
    const prisma = getTestPrisma();
    const bcrypt = await import('bcryptjs');
    const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } });
    if (user) {
      const hashed = await bcrypt.default.hash(TEST_USER_PASSWORD, 10);
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    }
  });

  test('user can add an address and see it in the list', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/account/addresses');

    await page.getByRole('button', { name: /Agregar nueva dirección/i }).click();

    // Use input ids (not labels) — the form's aria-label and the
    // surrounding card's aria-label both contain the word "dirección"
    // in a way that makes getByLabel('Dirección') ambiguous.
    await page.locator('#address-street-new').fill('Calle 100 #15-20');
    await page.locator('#address-city-new').fill('Bogotá');
    await page.locator('#address-state-new').fill('Cundinamarca');
    await page.locator('#address-zip-new').fill('110111');
    await page.locator('#address-phone-new').fill('+573001234567');

    await page.getByRole('button', { name: /Agregar dirección/i }).click();

    // Wait for the new address to appear in the list.
    await expect(page.getByText('Calle 100 #15-20').first()).toBeVisible({ timeout: 10_000 });

    // The first address added to an empty account should be marked
    // as the default — the badge is rendered as text.
    await expect(page.getByTestId('default-badge').first()).toBeVisible();
  });

  test('user can add a second address and set it as the default', async ({ page }) => {
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/account/addresses');

    // Add a first address (will be default).
    await page.getByRole('button', { name: /Agregar nueva dirección/i }).click();
    await page.locator('#address-street-new').fill('Calle Original #1');
    await page.locator('#address-city-new').fill('Bogotá');
    await page.locator('#address-state-new').fill('Cundinamarca');
    await page.locator('#address-zip-new').fill('110111');
    await page.locator('#address-phone-new').fill('+573001234567');
    await page.getByRole('button', { name: /Agregar dirección/i }).click();
    await expect(page.getByText('Calle Original #1').first()).toBeVisible({ timeout: 10_000 });

    // Add a second address — the "Marcar como predeterminada" checkbox
    // should be hidden because a default already exists.
    await page.getByRole('button', { name: /Agregar nueva dirección/i }).click();
    await expect(page.getByLabel('Marcar como predeterminada')).not.toBeVisible();
    await page.locator('#address-street-new').fill('Calle Nueva #42');
    await page.locator('#address-city-new').fill('Bogotá');
    await page.locator('#address-state-new').fill('Cundinamarca');
    await page.locator('#address-zip-new').fill('110222');
    await page.locator('#address-phone-new').fill('+573009876543');
    await page.getByRole('button', { name: /Agregar dirección/i }).click();
    await expect(page.getByText('Calle Nueva #42').first()).toBeVisible({ timeout: 10_000 });

    // Find the second address card and click "Marcar predeterminada".
    const newCard = page.getByTestId('address-card').filter({ hasText: 'Calle Nueva #42' });
    await newCard.getByRole('button', { name: /Marcar predeterminada/i }).click();

    // The badge should now appear on the new card.
    await expect(newCard.getByTestId('default-badge')).toBeVisible({ timeout: 10_000 });
  });

  test('user can delete a non-default address after confirming', async ({ page }) => {
    // The browser's confirm() dialog — auto-accept so the action proceeds.
    page.on('dialog', (dialog) => {
      void dialog.accept();
    });

    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/account/addresses');

    // Seed: one default + one non-default address.
    const prisma = getTestPrisma();
    const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } });
    if (!user) throw new Error('Test user missing — seed not run?');

    const defaultId = `e2e-default-${Date.now()}`;
    const otherId = `e2e-other-${Date.now()}`;
    await prisma.address.create({
      data: {
        id: defaultId,
        userId: user.id,
        street: 'Calle Default #1',
        city: 'Bogotá',
        state: 'Cundinamarca',
        zipCode: '110111',
        phone: '+573001111111',
        isDefault: true,
      },
    });
    await prisma.address.create({
      data: {
        id: otherId,
        userId: user.id,
        street: 'Calle AEliminar #99',
        city: 'Bogotá',
        state: 'Cundinamarca',
        zipCode: '110333',
        phone: '+573002222222',
        isDefault: false,
      },
    });

    await page.reload();

    const otherCard = page.getByTestId('address-card').filter({ hasText: 'Calle AEliminar #99' });
    await expect(otherCard).toBeVisible();
    await otherCard.getByRole('button', { name: /^Eliminar$/i }).click();

    // The card should disappear.
    await expect(
      page.getByTestId('address-card').filter({ hasText: 'Calle AEliminar #99' }),
    ).toHaveCount(0, { timeout: 10_000 });

    // The default card is still there.
    await expect(
      page.getByTestId('address-card').filter({ hasText: 'Calle Default #1' }),
    ).toBeVisible();
  });

  test('orders page filters by status via the tab strip', async ({ page }) => {
    const prisma = getTestPrisma();
    const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } });
    if (!user) throw new Error('Test user missing — seed not run?');

    // Clean up any existing orders for this user from previous test runs
    // (the test cleanup is best-effort — E2E prefixes are not used here
    // because juan's orders are seed-grade, not test data).
    await prisma.order.deleteMany({ where: { userId: user.id } });

    // Seed: one PAID + one PENDING order.
    const product = await prisma.product.findFirst({ select: { id: true, price: true } });
    if (!product) throw new Error('No seed product available');
    const refA = `e2e-acct-paid-${Date.now()}`;
    const refB = `e2e-acct-pending-${Date.now()}`;

    const paidOrder = await prisma.order.create({
      data: {
        userId: user.id,
        total: 100,
        status: 'PAID',
        wompiReference: refA,
        shippingAddress: { street: 'A', city: 'A', state: 'A', zipCode: 'A', phone: 'A' },
        items: { create: [{ productId: product.id, quantity: 1, price: 100 }] },
      },
    });
    const pendingOrder = await prisma.order.create({
      data: {
        userId: user.id,
        total: 200,
        status: 'PENDING',
        wompiReference: refB,
        shippingAddress: { street: 'B', city: 'B', state: 'B', zipCode: 'B', phone: 'B' },
        items: { create: [{ productId: product.id, quantity: 1, price: 200 }] },
      },
    });

    // The orders page renders `Pedido {shortId(order.id)}` where
    // shortId is the first 8 chars of the CUID. CUIDs created in
    // the same millisecond can share a prefix, so we don't trust
    // 8 chars for identity — we assert against the full id exposed
    // in the card's link `href` (`/orders/{id}`). Each test run
    // gets fresh ids, so this is reliable.
    await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);

    const paidLink = page.locator(`a[href="/orders/${paidOrder.id}"]`);
    const pendingLink = page.locator(`a[href="/orders/${pendingOrder.id}"]`);

    // Default (Todos): both orders visible.
    await page.goto('/orders');
    await expect(paidLink).toBeVisible();
    await expect(pendingLink).toBeVisible();

    // PAID filter: only the PAID order is visible.
    await page.goto('/orders?status=PAID');
    await expect(paidLink).toBeVisible();
    await expect(pendingLink).toHaveCount(0);

    // PENDING filter: only the PENDING order is visible.
    await page.goto('/orders?status=PENDING');
    await expect(pendingLink).toBeVisible();
    await expect(paidLink).toHaveCount(0);

    // Final cleanup.
    await prisma.order.deleteMany({ where: { userId: user.id } });
  });
});
