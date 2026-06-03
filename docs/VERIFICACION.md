# VERIFICACIÓN — gamer-gear-co

> **Este es tu documento de "qué verificar al despertar".** Todo el proyecto (Phases 0-7) está listo. Solo falta deploy (Phase 8).
> Última actualización: 2026-06-03 (post Phase 7)

## TL;DR — Estado de fases

| Fase | Descripción | Estado | Commit | Tests | Notas |
|------|-------------|--------|--------|-------|-------|
| 0 | Setup + tooling | ✅ shipped | — | — | Next 14 + pnpm + Prisma 7 + NextAuth v5 |
| 1 | Auth + users | ✅ shipped | `a6c7b17` | 62→110 | NextAuth Credentials + roles USER/ADMIN |
| 2 | Catálogo | ✅ shipped | `db37e9e` | 110 | 30 productos, imágenes reales Unsplash |
| 3 | Cart | ✅ shipped | `db37e9e` | 110 | Cart auth-only, useOptimistic, badge sync |
| 4 | Checkout + Wompi | ✅ shipped | `21da855` | 110 unit + 9 E2E | Webhook firmado, polling, FAILED status |
| 5 | Admin | ✅ shipped | `88da967` | 179 unit + 18 E2E | Layout, dashboard, CRUD, upload, redirect-loop fix |
| 6 | Profile + addresses | ✅ shipped | `37fdd01` | 211 unit + 30 E2E | /account, /account/addresses, orders status filter, save-on-checkout |
| 7 | Polish | ✅ shipped | `c2d5006` | 211 unit + 30 E2E | Loading/error/404 boundaries + skip-to-content (a11y) |
| 8 | Deploy | 🔲 pendiente | — | — | Vercel config + env vars (ver "Deploy" más abajo) |

**Tests totales**: 211 unit (vitest) + 29 E2E passing + 1 skipped (Wompi UI happy path).

---

## 1. Verificación rápida al despertar (5 minutos)

```bash
cd gamer-gear-co
pnpm install                      # por si acaso
pnpm typecheck                    # debe dar 0 errores
pnpm test                         # debe dar 211/211 passing
pnpm lint                         # debe dar 0 warnings
pnpm test:e2e                     # debe dar 29 passed, 1 skipped
```

Si TODO pasa, el código está bien. Cualquier fallo es regresión — `git log` para ver qué cambió.

---

## 2. Cómo correr el proyecto localmente

```bash
# Asume Node 20+, pnpm, PostgreSQL 16 corriendo en localhost:5432
# Asume usuario postgres / password postgres
# Asume DB `gamerstore` creada

cd gamer-gear-co
pnpm install
pnpm prisma migrate deploy
pnpm prisma:seed                  # opcional, crea 30 productos + admin
pnpm dev
```

App en `http://localhost:3000`.

### Variables de entorno (`.env`)

```bash
# Requeridas
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gamerstore?schema=public"
AUTH_SECRET="<openssl rand -base64 32>"
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Wompi sandbox (https://docs.wompi.co/docs/en/test-your-integration)
NEXT_PUBLIC_WOMPI_PUBLIC_KEY="<tu_public_key_sandbox>"
WOMPI_PRIVATE_KEY="<tu_private_key_sandbox>"
WOMPI_EVENTS_SECRET="<tu_events_secret_sandbox>"
WOMPI_REDIRECT_URL="http://localhost:3000/orders"
WOMPI_ENV="sandbox"

# Opcionales (Vercel Blob para imágenes en admin — Phase 5)
BLOB_READ_WRITE_TOKEN="<vercel_blob_token>"

# Tests E2E (Playwright)
DATABASE_URL_TEST="postgresql://postgres:postgres@localhost:5432/gamerstore_test?schema=public"
```

> ⚠️ El archivo `.env` está encriptado con dotenvx. Usa `dotenvx get` o el dashboard de dotenvx para ver/editar valores. O exporta las variables manualmente antes de los comandos.

---

## 3. Credenciales de prueba (seed)

```
email:    juan@example.com
password: User1234!
role:     USER

email:    admin@gamerstore.co
password: Admin123!
role:     ADMIN
```

Seed crea: 5 marcas (Razer, Logitech G, Corsair, HyperX, Redragon), 4 categorías (Mouse, Teclado, Headset, Mousepad), 30 productos con imágenes reales de Unsplash.

---

## 4. Smoke test manual (15 minutos)

### Cliente

1. **Registro/Login** → `http://localhost:3000/register`, `http://localhost:3000/login`
2. **Catálogo** → `/products` con filtros por marca, categoría, precio
3. **Detalle de producto** → `/products/razer-deathadder-v3-pro`
4. **Agregar al carrito** → stepper de cantidad, toast, badge se incrementa
5. **Carrito** → `/cart` con summary, "Proceder al pago" CTA
6. **Checkout** → `/checkout` (requiere auth), form 7 campos, checkbox "Guardar esta dirección"
7. **Wompi sandbox** → submit redirige a `https://sandbox.wompi.co/...`
   - Tarjeta aprobada: `4242 4242 4242 4242`
   - Tarjeta declinada: `4111 1111 1111 1111`
8. **Volver de Wompi** → `/orders/[id]` con status PENDING; el poller refresca cada 5s hasta 60s
9. **Mis pedidos** → `/orders` con **filtro por status** (Todos/Pendientes/Pagados/Enviados/Entregados/Fallidos/Cancelados)
10. **Mi cuenta** → `/account` con profile form, password form, direcciones, pedidos recientes
11. **Direcciones** → `/account/addresses` con CRUD (agregar/editar/eliminar/marcar predeterminada)
12. **Mobile** → abrir en DevTools mobile viewport (375px) — el layout se adapta

### Admin (login con admin@gamerstore.co)

13. **Dashboard** → `/admin` con stats (total productos, órdenes, ingresos, usuarios)
14. **Productos** → `/admin/products` con CRUD, upload de imágenes a Vercel Blob
15. **Marcas** → `/admin/brands` con CRUD
16. **Categorías** → `/admin/categories` con CRUD
17. **Órdenes** → `/admin/orders` con filtro por status, ver detalle, actualizar status (SHIPPED, DELIVERED, CANCELLED)
18. **Usuarios** → `/admin/users` con búsqueda, ver detalle, promover/degradar (protección anti self-demote del último admin)

### Webhook (manual con ngrok)

```bash
# Terminal 1
pnpm dev

# Terminal 2
ngrok http 3000
# Copia la URL https://<random>.ngrok.io

# En Wompi dashboard sandbox:
# Settings → Webhooks → Add endpoint: https://<random>.ngrok.io/api/wompi/webhook
# Events: transaction.updated
# Click "Send test event" para validar
```

---

## 5. Issues conocidos

### 1 E2E test skipped (esperado, no es bug)

- `tests/e2e/checkout-happy-path.spec.ts` subtest "UI happy path" auto-skips si falta `WOMPI_REDIRECT_URL` en `.env`. El subtest crítico ("webhook APPROVED con verificación de firma") **sí corre** y pasa.

### Decisiones de Phase 4 que conviene saber

- **Stock se decrementa al PAID**, no al PENDING. Trade-off: ventana de oversell bajo concurrencia extrema. Con 30 productos / tráfico bajo, aceptable. Si cambia el tráfico, mover a PENDING con TTL de 15 min.
- **Cart NO se limpia en FAILED**. Si el cliente quiere reintentar, sus items siguen ahí. Decisión de UX.
- **GetOrder** lanza `OrderNotFoundError` (no 403) para no-owners — no leakeamos existencia de pedidos ajenos.

### Limitaciones de Phase 6

- /account/not-found.tsx existe pero raramente se usa (la mayoría de subpaths sin auth redirigen a /login).
- El password change no invalida otras sesiones del mismo usuario (no es crítico para el caso de uso).

### Limitaciones de Phase 7 (Polish)

- No hay mobile menu (los links de navbar están hidden en mobile, no hay hamburger). Decidido out-of-scope — un futuro UX pass lo agregará.
- No hay favicon configurado explícitamente (usa el default de Next.js).
- No hay sitemap.xml o robots.txt (SEO básico post-deploy).

---

## 6. Arquitectura (resumen para referencia)

```
src/
  domain/                  # Pure TypeScript, NO Prisma imports
    entities/              # zod schemas + factories (Address, Brand, CartItem, ...)
    use-cases/             # auth/, products/, cart/, orders/, admin/, addresses/, account/
    repositories/          # INTERFACES (User, Product, Cart, Order, Address, Brand, Category)
    errors/                # Domain errors (Cart, Order, Admin, User, Address, Account)
    __tests__/mocks.ts     # createMockXxxRepository
  infrastructure/
    db/prisma.ts           # Prisma client w/ @prisma/adapter-pg
    repositories/          # PrismaXxxRepository implements XxxRepository
    auth/                  # NextAuth v5 config + password-hasher + middleware role check
    payments/              # Wompi + verify-webhook + webhook handler
    uploads/               # Vercel Blob wrapper
  presentation/
    components/ui/         # shadcn primitives
    components/            # app-level (navbar, footer, product-card, empty-state, ...)
    hooks/                 # useCartCount
    lib/                   # {cart,order,admin,account}-deps.ts factories
  app/
    (auth)/login/, (auth)/register/
    (shop)/                # products, brands, cart, checkout, orders
    (admin)/admin/         # dashboard, products, brands, categories, orders, users
    account/               # profile, addresses
    api/wompi/webhook/     # App Router POST handler
    api/admin/upload/      # App Router POST handler (admin-only)
```

**Clean Architecture**: domain ← infrastructure ← presentation. Domain NO importa de infrastructure ni presentation.

---

## 7. Deploy en Vercel (Phase 8 — pendiente)

### Pasos

1. Crear un nuevo proyecto en [vercel.com/new](https://vercel.com/new) desde este repo
2. Configurar las variables de entorno (ver §2)
3. **Build & Development Settings**:
   - Build Command: dejar por defecto (`next build`)
   - Install Command: `pnpm install`
4. Crear una base de datos Postgres (Neon free tier, Supabase, o Vercel Postgres)
5. **Post-deploy**: correr migraciones localmente apuntando a la DB de producción:
   ```bash
   DATABASE_URL="<production_db_url>" pnpm prisma migrate deploy
   DATABASE_URL="<production_db_url>" pnpm prisma:seed    # opcional
   ```
6. Crear un **Vercel Blob store** en el dashboard → Storage → Create Database → Blob
7. Configurar el **webhook en Wompi** dashboard → `https://tu-dominio.vercel.app/api/wompi/webhook` (events: transaction.updated)
8. **Smoke test** en producción con tarjeta de sandbox (`4242 4242 4242 4242`)

### Post-deploy

- **Email confirmation**: hookear `resend` (ya en package.json) para enviar email cuando order pasa a PAID
- **Real Wompi keys**: cambiar `WOMPI_ENV` de "sandbox" a "production" y actualizar las llaves
- **Dominio custom**: configurar en Vercel → Settings → Domains
- **Analytics**: opcional, Vercel Analytics está disponible out-of-the-box

---

## 8. Comandos útiles

```bash
# DB
pnpm prisma:studio        # UI en http://localhost:5555
pnpm prisma migrate dev   # nueva migración (dev)
pnpm prisma migrate deploy # aplicar migraciones pendientes (prod)
pnpm prisma:seed          # re-seed (idempotente: actualiza imágenes)

# Tests
pnpm test -- --watch      # vitest watch mode
pnpm test:e2e -- --ui     # playwright UI mode
pnpm test:e2e -- --grep "checkout"  # solo checkout specs

# Quality gates
pnpm typecheck
pnpm lint
pnpm format
```

> ❌ No corras `pnpm build` localmente — convención del proyecto. El typecheck + tests son las gates.

---

## 9. Próximos pasos después de Phase 8

Una vez deployado y validado en producción:
- **Email confirmation**: hookear `resend` para enviar email cuando order pasa a PAID
- **Address book UI** retro-fit: agregar "usar dirección guardada" en /checkout (ya existe el modelo + UI en /account/addresses, solo falta wirear el checkout)
- **Refunds**: requiere `wompi.transactions.refund` y nuevo status `REFUNDED`
- **Inventory holds**: si el tráfico sube, cambiar stock-at-PENDING con TTL
- **Nequi/PSE/Bancolombia**: agregar en Wompi Web Checkout son 3 integraciones, una por método
- **Mobile menu** para navbar (UX pass)
- **Favicon + sitemap.xml + robots.txt** (SEO básico)
- **Lighthouse 90+ audit** y aplicar optimizaciones (next/image, prefetch hints, etc.)
