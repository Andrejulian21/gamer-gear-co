# Gamer Gear Colombia

> Plataforma de e-commerce full-stack para periféricos gamer en Colombia, construida como proyecto de portafolio para demostrar habilidades modernas de desarrollo web.

[![CI](https://github.com/Andrejulian21/gamer-gear-co/actions/workflows/ci.yml/badge.svg)](https://github.com/Andrejulian21/gamer-gear-co/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![License: None](https://img.shields.io/badge/License-None-red)]()

[Demo](https://gamer-gear-co.vercel.app) · [Reportar Bug](https://github.com/Andrejulian21/gamer-gear-co/issues) · [Solicitar Feature](https://github.com/Andrejulian21/gamer-gear-co/issues)

## Acerca del proyecto

Aplicación **e-commerce full-stack** para vender periféricos gamer (mouse, teclados, headsets, mousepads) de las marcas más importantes del mercado colombiano: **Razer, Logitech G, Corsair, HyperX y Redragon**.

El objetivo es demostrar una arquitectura de e-commerce lista para producción con integración real de pagos (**Wompi** — soporta PSE, Nequi, Bancolombia y tarjetas crédito/débito), autenticación con roles (**USER** y **ADMIN**) y un panel administrativo completo para gestionar productos y órdenes.

**¿Por qué este proyecto?** Lo construí como pieza de portafolio para mostrar mis habilidades full-stack a reclutadores. Cubre toda la pila: diseño de base de datos, Server Actions, autenticación, pagos, subida de archivos, emails, testing, CI/CD y despliegue.

## Funcionalidades

- Shopping **Catálogo de productos** con 5 marcas y 4 categorías
- Search **Filtros y búsqueda** por marca, categoría y rango de precio
- Cart **Carrito persistente** con actualizaciones optimistas
- Payment **Pagos colombianos** vía Wompi (PSE, Nequi, Bancolombia, tarjetas)
- Auth **Auth por roles** con NextAuth v5 (USER + ADMIN)
- User **Perfil de usuario** con historial de órdenes y direcciones
- Admin **Panel administrativo** con CRUD de productos, gestión de órdenes y roles
- Charts **Dashboard de ventas** con visualizaciones en Recharts
- Email **Emails transaccionales** vía Resend
- Images **Subida de imágenes** vía Vercel Blob
- Test **TDD en capa de dominio** (casos de uso con Clean Architecture)
- CI/CD **CI/CD** con GitHub Actions
- Mobile **Diseño responsive** (mobile-first)

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 14 (App Router) + TypeScript |
| **Estilos** | Tailwind CSS + shadcn/ui |
| **Base de datos** | PostgreSQL (Neon free tier) |
| **ORM** | Prisma 7 |
| **Auth** | NextAuth.js v5 (Auth.js) con Credentials |
| **Pagos** | Wompi (pasarela colombiana) |
| **Estado** | Zustand (carrito) + React Query (datos) |
| **Formularios** | React Hook Form + Zod |
| **Gráficas** | Recharts (dashboard admin) |
| **Email** | Resend |
| **Almacenamiento** | Vercel Blob |
| **Testing** | Vitest (unit) + Playwright (E2E) |
| **CI/CD** | GitHub Actions |
| **Deploy** | Vercel |

## Arquitectura

El proyecto sigue principios de **Clean Architecture** para mantener la lógica de dominio desacoplada de frameworks y servicios externos:

```
src/
├── app/                    # Rutas de Next.js (presentación)
│   ├── (auth)/            # /login, /register
│   ├── (shop)/            # /products, /brands, /cart, /checkout
│   ├── (account)/         # /profile, /orders, /addresses
│   ├── (admin)/           # /admin/products, /admin/orders, /admin/users
│   └── api/               # Webhooks (Wompi, etc.)
├── domain/                # Lógica de negocio pura (SIN dependencias de frameworks)
│   ├── entities/          # Tipos de dominio y factorías
│   ├── repositories/      # Interfaces de repositorios (puertos)
│   └── use-cases/         # Reglas de negocio (testeadas con TDD)
├── infrastructure/        # Adaptadores externos
│   ├── db/                # Cliente Prisma
│   ├── payment/           # Cliente Wompi + verificación de firma
│   └── auth/              # Configuración NextAuth
├── presentation/          # Componentes UI y hooks
└── shared/                # Utils, tipos, constantes
```

**Por qué importa para un portafolio:** Demuestra que entiendo separación de responsabilidades, inversión de dependencias y que la lógica de dominio no está acoplada a Next.js o Prisma.

## Empezando

### Prerrequisitos

- Node.js 22+
- pnpm 10+
- Base de datos PostgreSQL (o usar el [free tier de Neon](https://neon.tech))

### Instalación

```bash
# 1. Clonar el repo
git clone https://github.com/Andrejulian21/gamer-gear-co.git
cd gamer-gear-co

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus valores reales de DATABASE_URL, NEXTAUTH_SECRET, llaves WOMPI, etc.

# 4. Configurar la base de datos
pnpm prisma:generate
pnpm prisma:migrate

# 5. (Opcional) Sembrar la base de datos
pnpm prisma:seed

# 6. Levantar el servidor de desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Iniciar servidor de desarrollo |
| `pnpm build` | Compilar para producción |
| `pnpm start` | Iniciar servidor de producción |
| `pnpm lint` | Ejecutar ESLint |
| `pnpm typecheck` | Ejecutar verificación de TypeScript |
| `pnpm test` | Correr tests unitarios (Vitest) |
| `pnpm test:watch` | Correr tests unitarios en modo watch |
| `pnpm test:e2e` | Correr tests E2E (Playwright) |
| `pnpm format` | Formatear código con Prettier |
| `pnpm prisma:generate` | Generar cliente de Prisma |
| `pnpm prisma:migrate` | Ejecutar migraciones de base de datos |
| `pnpm prisma:studio` | Abrir Prisma Studio |
| `pnpm prisma:seed` | Sembrar la base de datos |

## Estado del proyecto

Este es un **proyecto de portafolio en desarrollo activo**. Todas las fases planeadas están completas (0-7). Phase 8 (deploy en Vercel) está lista para ejecutar — ver `docs/VERIFICACION.md` para la guía de despliegue.

### Roadmap

- [x] **Phase 0** — Setup del proyecto, tooling, CI, README
- [x] **Phase 1** — Schema de base de datos, NextAuth, middleware por roles
- [x] **Phase 2** — Catálogo público (30 productos, 5 marcas, 4 categorías)
- [x] **Phase 3** — Carrito persistente con auth-only y useOptimistic
- [x] **Phase 4** — Checkout + Wompi (PSE, Nequi, Bancolombia, tarjetas) + webhooks firmados
- [x] **Phase 5** — Panel admin (CRUD productos/marcas/categorías/órdenes/usuarios + Vercel Blob)
- [x] **Phase 6** — Perfil de usuario, direcciones, historial de órdenes con filtro de status
- [x] **Phase 7** — Pulido: loading/error/404 boundaries + skip-to-content (a11y)
- [ ] **Phase 8** — Deploy en Vercel (configurar env vars, smoke test en producción)

**Tests**: 211 unit + 29 E2E passing (1 E2E skipped — necesita `WOMPI_REDIRECT_URL`).

## Despliegue en Vercel

### Variables de entorno requeridas

```bash
# Base de datos
DATABASE_URL="postgresql://..."   # Neon / Supabase / Vercel Postgres

# NextAuth
AUTH_SECRET="<openssl rand -base64 32>"
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL="https://tu-dominio.vercel.app"
NEXTAUTH_URL="https://tu-dominio.vercel.app"

# Wompi (sandbox para empezar, producción después)
NEXT_PUBLIC_WOMPI_PUBLIC_KEY="<tu_public_key>"
WOMPI_PRIVATE_KEY="<tu_private_key>"
WOMPI_EVENTS_SECRET="<tu_events_secret>"
WOMPI_REDIRECT_URL="https://tu-dominio.vercel.app/orders"
WOMPI_ENV="sandbox"             # o "production"

# Vercel Blob (para upload de imágenes en admin)
BLOB_READ_WRITE_TOKEN="<vercel_blob_token>"
```

### Pasos

1. Conectar el repo en [vercel.com/new](https://vercel.com/new)
2. Configurar las variables de entorno arriba
3. En **Build & Development Settings**:
   - Build Command: dejar por defecto (`next build`)
   - Install Command: `pnpm install`
4. Agregar un **Postgres** (Neon, Supabase, o Vercel Postgres)
5. Después del primer deploy, correr las migraciones:
   ```bash
   # Local con la DATABASE_URL de producción
   pnpm prisma migrate deploy
   pnpm prisma:seed    # opcional, crea 30 productos + admin
   ```
6. Configurar el webhook en Wompi dashboard → `https://tu-dominio.vercel.app/api/wompi/webhook`
7. Smoke test: registrar un usuario, agregar al carrito, checkout con `4242 4242 4242 4242`

> Para Vercel Blob: crear un store en el dashboard de Vercel → Storage → Create Database → Blob.

Ver `docs/VERIFICACION.md` para troubleshooting y configuración detallada.

## Licencia

Este proyecto **no tiene licencia** — todos los derechos reservados. El código se comparte públicamente con fines de portafolio, pero por favor contáctame antes de usarlo comercialmente.

## Autor

**Andrejulian21**
- GitHub: [@Andrejulian21](https://github.com/Andrejulian21)
