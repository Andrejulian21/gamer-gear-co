import type { Page } from '@playwright/test';

import { loginAs } from './auth';

/**
 * Convenience wrapper around `loginAs` for the seeded admin user
 * (`prisma/seed.ts`). The seed runs `pnpm prisma:seed` and creates
 * admin@gamerstore.co / Admin123! — those exact credentials are
 * used here and in the admin-gate E2E spec.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await loginAs(page, 'admin@gamerstore.co', 'Admin123!');
}
