import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Load .env locally so DATABASE_URL is available to `prisma migrate`,
// `prisma db push`, and the seed. On Vercel install-time there is no
// .env, so `dotenv/config` is a no-op and the conditional spread below
// keeps the config valid for `prisma generate` (which doesn't need DB).
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  ...(databaseUrl
    ? {
        datasource: {
          url: databaseUrl,
        },
      }
    : {}),
});
