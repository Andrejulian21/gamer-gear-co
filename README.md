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

Este es un **proyecto de portafolio en desarrollo activo**. Fase actual: **Phase 1 — DB + Auth** ✅

### Roadmap

- [x] **Phase 0** — Setup del proyecto, tooling, CI, README
- [x] **Phase 1** — Schema de base de datos, NextAuth, middleware por roles
- [ ] **Phase 2** — Catálogo público (navegación, filtros, búsqueda)
- [ ] **Phase 3** — Carrito persistente con Zustand
- [ ] **Phase 4** — Checkout + integración de pagos Wompi + webhooks
- [ ] **Phase 5** — Panel admin (CRUD productos, gestión de órdenes)
- [ ] **Phase 6** — Perfil de usuario, direcciones, historial de órdenes
- [ ] **Phase 7** — Pulido, SEO, screenshots, Lighthouse 90+
- [ ] **Phase 8** — Deploy en Vercel, configurar Wompi en producción

## Licencia

Este proyecto **no tiene licencia** — todos los derechos reservados. El código se comparte públicamente con fines de portafolio, pero por favor contáctame antes de usarlo comercialmente.

## Autor

**Andrejulian21**
- GitHub: [@Andrejulian21](https://github.com/Andrejulian21)
