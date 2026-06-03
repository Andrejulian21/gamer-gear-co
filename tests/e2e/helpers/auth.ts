import type { Page } from '@playwright/test';

export interface SignUpOptions {
  email: string;
  password: string;
  name: string;
}

/**
 * Registers a brand-new user via the /register form and verifies the
 * post-signin redirect lands on the home page.
 *
 * Assumes the registration action automatically signs the user in
 * (verified in src/app/(auth)/actions.ts -> registerAction).
 */
export async function signUpAndLogin(page: Page, { email, password, name }: SignUpOptions) {
  await page.goto('/register');

  await page.getByLabel('Nombre completo').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel(/Contraseña/).fill(password);

  await Promise.all([
    page.waitForURL('**/', { timeout: 15_000 }),
    page.getByRole('button', { name: /Crear cuenta/i }).click(),
  ]);
}

/**
 * Logs in an existing user via the /login form. Works with seeded users
 * (e.g. admin@gamerstore.co / Admin123!, juan@example.com / User1234!).
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(password);

  await Promise.all([
    page.waitForURL('**/', { timeout: 15_000 }),
    page.getByRole('button', { name: /Ingresar/i }).click(),
  ]);
}
