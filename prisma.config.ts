import { defineConfig } from 'prisma/config';

// `databaseUrl` is read lazily so that `prisma generate` (which doesn't
// touch the DB) works in environments where DATABASE_URL is not yet
// available — namely `pnpm install` on Vercel, where env vars are only
// exposed at build-time, not install-time. `prisma migrate` and other
// DB-touching commands still get the value when DATABASE_URL is set.
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
