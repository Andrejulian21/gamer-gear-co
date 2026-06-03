# VERIFICACIÓN — gamer-gear-co

> Lista de comprobación para validar el proyecto cuando despiertes.
> Última actualización: 2026-06-03 (Phase 4 integrado)

## TL;DR

| Fase | Estado | Commit final | Tests | Notas |
|------|--------|--------------|-------|-------|
| 1. Auth + users | ✅ shipped | `a6c7b17`-era | 62 → 110 | NextAuth v5 Credentials + roles |
| 2. Catálogo | ✅ shipped | `db37e9e` | 110 | 30 productos, imágenes reales Unsplash, 3 logos reales |
| 3. Cart | ✅ shipped | `db37e9e` | 110 | Cart auth-only, useOptimistic, badge sync |
| 4. Checkout + Wompi | ✅ shipped | `21da855` | 110 unit + 9 E2E | Webhook firmado, polling de status, FAILED status |
| 5. Admin | ✅ shipped | `88da967` | 179 unit + 18 E2E | Layout, dashboard, products/brands/categories/orders/users CRUD, upload API, redirect-loop fix |
| 6. Profile | 🔲 pendiente | — | — | Planner corriendo |
| 7. Polish | 🔲 pendiente | — | — | |
| 8. Deploy | 🔲 pendiente | — | — | |

---

## 1. Cómo correr el proyecto

```bash
# Asume Node 20+, pnpm, PostgreSQL 16 corriendo en localhost:5432
# Asume usuario postgres / password postgres
# Asume DB `gamerstore` creada

cd gamer-gear-co
pnpm install
pnpm prisma migrate deploy
pnpm prisma:seed
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
WOMPI_REDIRECT_URL="http://localhost:3000/orders"   # base; el id se concatena
WOMPI_ENV="sandbox"

# Opcionales (Vercel Blob para imágenes en admin — Phase 5)
BLOB_READ_WRITE_TOKEN="<vercel_blob_token>"

# Tests E2E (Playwright)
DATABASE_URL_TEST="postgresql://postgres:postgres@localhost:5432/gamerstore_test?schema=public"
```

> ⚠️ Phase 4 dejó 1 test E2E **skipped** porque `WOMPI_REDIRECT_URL` no estaba en el `.env` del dev que corrió gamma. Agrega las claves de sandbox para activarlo.

---

## 2. Tests

```bash
pnpm typecheck           # 0 errores
pnpm test                # 110/110 unit + integration (vitest)
pnpm test:e2e            # 9/14 E2E (Playwright) — ver issues abajo
```

### Cobertura por área

| Área | Tests | Estilo |
|------|-------|--------|
| Domain (Cart, Orders, Products, Brands, Categories, Users) | ~90 | TDD-strict, mocks |
| Infrastructure (Wompi, verify-webhook) | ~15 | TDD-strict |
| E2E happy path checkout | 1 ✅ + 1 ⏭️ | Playwright + sandbox mock |
| E2E declined card | 3 ✅ | Signed webhook forging |
| E2E auth redirect | 1 ✅ | |
| E2E cart (Phase 3) | 6 ✅ + 3 ❌ | **Issues pre-existentes — ver §5** |

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

Seed crea 5 marcas (Razer, Logitech G, Corsair, HyperX, Redragon), 4 categorías (Mouse, Teclado, Headset, Mousepad), 30 productos con imágenes reales de Unsplash.

---

## 4. Flujos a verificar manualmente (smoke test)

### Cliente

1. **Registro/Login** → `http://localhost:3000/register`, `http://localhost:3000/login`
2. **Catálogo** → `/products` con filtros por marca, categoría, precio
3. **Detalle de producto** → `/products/razer-deathadder-v3-pro` (o cualquier slug del seed)
4. **Agregar al carrito** → stepper de cantidad, toast de éxito, badge en navbar se incrementa
5. **Carrito** → `/cart` con summary, "Proceder al pago" CTA
6. **Checkout** → `/checkout` (requiere auth), form con 7 campos
7. **Wompi sandbox** → submit redirige a `https://sandbox.wompi.co/...`
   - Tarjeta de prueba aprobada: `4242 4242 4242 4242`
   - Tarjeta de prueba declinada: `4111 1111 1111 1111`
8. **Volver de Wompi** → `/orders/[id]` con status PENDING; el poller refresca cada 5s hasta 60s; el webhook real actualiza a PAID o FAILED
9. **Mis pedidos** → `/orders` con lista de pedidos del usuario

### Admin (Phase 5 — pendiente)

10. **Login como admin** → `admin@gamerstore.co`
11. **`/admin`** → dashboard con stats
12. **`/admin/products`** → CRUD de productos con upload de imágenes a Vercel Blob
13. **`/admin/orders`** → ver todos los pedidos, actualizar status (SHIPPED, DELIVERED, CANCELLED)
14. **`/admin/users`** → ver usuarios, promover/degradar (con protección anti self-demote del último admin)

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

## 5. Issues conocidos (requieren tu atención)

### ❌ 3 E2E tests pre-existentes fallando (Phase 3)

Estos tests fallaban ANTES de Phase 4. Beta no los tocó. Funcionalidad del cart funciona correctamente — son bugs en los tests mismos:

| # | Test | Causa | Fix sugerido |
|---|------|-------|--------------|
| 1 | `cart.spec.ts:19` "logged-in user can add an item and the cart badge increments" | El test aserta `getByRole('alert')` count = 0 después de agregar. Pero `AddToCartButton` ahora muestra `toast.success('Producto agregado al carrito')` que tiene role alert. El test fue escrito antes del toast. | Cambiar a `toHaveCount(1)` (success toast esperado) o filtrar por `[data-sonner-toast][data-type="error"]` |
| 2 | `cart.spec.ts:39` "logged-in user can update quantity and remove item from the cart page" | State pollution entre tests (DB de test compartida sin cleanup). El test empieza con qty=5 porque tests anteriores dejaron el carrito con items, no con qty=1. | Agregar `test.beforeEach` con `cartRepository.clear(userId)` o usar `test.describe.configure({ mode: 'serial' })` + cleanup |
| 3 | `cart.spec.ts:73` "quantity input respects the maxQuantity (stock) cap" | El test busca `getByLabel(/Cantidad:/)` (con dos puntos). El `AddToCartButton` define `aria-label="Cantidad"` (sin dos puntos). | Cambiar regex a `/^Cantidad$/` o `getByLabel('Cantidad', { exact: true })` |

### ⏭️ 1 E2E test skipped

- `tests/e2e/checkout-happy-path.spec.ts` subtest "UI happy path" auto-skips si falta `WOMPI_REDIRECT_URL` en `.env`. El subtest crítico ("webhook APPROVED con verificación de firma") **sí corre** y pasa.

### ⚠️ UI gaps conocidos de Phase 4

- No hay "guardar dirección para la próxima" (el modelo `Address` existe en schema, Phase 6 lo levantará)
- `OrderPoller` agota el presupuesto de 60s y muestra "te enviaremos un email" — el éxito por toast puede perderse si el usuario navega fuera en esos 60s
- `Order detail` hidrata items vía `productRepo.findMany({ limit: 200 })` — no es un join nativo. Con 200 productos funciona, pero en escala cambiar `PrismaOrderRepository` para hacer include de items.product

### ⚠️ Decisiones de Phase 4 que conviene saber

- **Stock se decrementa al PAID**, no al PENDING. Trade-off: hay una ventana de oversell bajo concurrencia extrema. Con 30 productos / tráfico bajo, aceptable. Si cambia el tráfico, mover a PENDING con TTL de 15 min.
- **Cart NO se limpia en FAILED**. Si el cliente quiere reintentar, sus items siguen ahí. Decisión de UX.
- **GetOrder** lanza `OrderNotFoundError` (no 403) para no-owners — no leakeamos existencia de pedidos ajenos.

---

## 6. Arquitectura (resumen para referencia)

```
src/
  domain/                  # Pure TypeScript, NO Prisma imports
    entities/              # zod schemas + factories
    use-cases/             # cart/, orders/, admin/
    repositories/          # INTERFACES
    errors/                # Domain errors (Cart, Order, Admin, User)
    __tests__/mocks.ts     # createMockXxxRepository
  infrastructure/
    db/prisma.ts           # Prisma client w/ @prisma/adapter-pg
    repositories/          # PrismaXxxRepository implements XxxRepository
    auth/                  # NextAuth v5 config + middleware role check
    payments/              # Wompi + verify-webhook
    uploads/               # Vercel Blob wrapper
  presentation/
    components/ui/         # shadcn primitives
    components/            # app-level components
    hooks/                 # useCartCount etc.
    lib/                   # {cart,order,admin}-deps.ts factories
  app/
    (auth)/login/, (auth)/register/
    (shop)/                # products, cart, checkout, orders
    (admin)/admin/         # dashboard, products, brands, categories, orders, users
    api/wompi/webhook/     # App Router POST handler
    api/admin/upload/      # App Router POST handler (admin-only)
```

**Clean Architecture**: domain ← infrastructure ← presentation. Domain NO importa de infrastructure ni presentation.

---

## 7. Próximos pasos (después de Phase 8)

Una vez deployado:
- **Email confirmation post-Phase 4**: hookear `resend` (ya en package.json) para enviar email de confirmación cuando order pasa a PAID
- **Address book UI** (Phase 6 la levantará): una vez activa, retro-fittear la fase 4 para ofrecer "usar dirección guardada" en /checkout
- **Refunds**: requiere `wompi.transactions.refund` y nuevo status `REFUNDED`
- **Inventory holds**: si el tráfico sube, cambiar stock-at-PENDING con TTL
- **Nequi/PSE/Bancolombia**: agregar en Wompi Web Checkout son 3 integraciones, una por método

---

## 8. Comandos útiles

```bash
# DB
pnpm prisma:studio        # UI en http://localhost:5555
pnpm prisma migrate dev   # nueva migración (dev)
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

> ❌ No corras `pnpm build` — convención del proyecto. El typecheck + tests son las gates.
