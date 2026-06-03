# Gamer Gear Colombia

> Full-stack e-commerce platform for gaming peripherals in Colombia, built as a portfolio project to demonstrate modern web development skills.

[![CI](https://github.com/Andrejulian21/gamer-gear-co/actions/workflows/ci.yml/badge.svg)](https://github.com/Andrejulian21/gamer-gear-co/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![License: None](https://img.shields.io/badge/License-None-red)]()

[Demo](https://gamer-gear-co.vercel.app) · [Report Bug](https://github.com/Andrejulian21/gamer-gear-co/issues) · [Request Feature](https://github.com/Andrejulian21/gamer-gear-co/issues)

## About

This is a **full-stack e-commerce application** for selling gaming peripherals (mice, keyboards, headsets, mousepads) from top brands in the Colombian market: **Razer, Logitech G, Corsair, HyperX, and Redragon**.

The goal is to demonstrate a production-ready e-commerce architecture with real payment integration (Wompi — supports PSE, Nequi, Bancolombia, credit/debit cards), role-based authentication (USER + ADMIN), and a complete admin panel for product/order management.

**Why this project?** I built it as a portfolio piece to showcase my full-stack development skills to recruiters. It covers the entire stack: database design, REST/Server Actions, authentication, payments, file uploads, emails, testing, CI/CD, and deployment.

## Features

- Shopping **Product catalog** with 5 brands and 4 categories
- Search **Filtering and search** by brand, category, and price range
- Cart **Persistent cart** with optimistic updates
- Payment **Colombian payments** via Wompi (PSE, Nequi, Bancolombia, cards)
- Auth **Role-based auth** with NextAuth v5 (USER + ADMIN)
- User **User profile** with order history and addresses
- Admin **Admin panel** for product CRUD, order management, and user roles
- Charts **Sales dashboard** with Recharts visualizations
- Email **Transactional emails** via Resend
- Images **Image uploads** via Vercel Blob
- Test **TDD on domain layer** (Clean Architecture use cases)
- CI/CD **CI/CD** with GitHub Actions
- Mobile **Responsive design** (mobile-first)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) + TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | PostgreSQL (Neon free tier) |
| **ORM** | Prisma 7 |
| **Auth** | NextAuth.js v5 (Auth.js) with Credentials |
| **Payments** | Wompi (Colombian gateway) |
| **State** | Zustand (cart) + React Query (data) |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts (admin dashboard) |
| **Email** | Resend |
| **Storage** | Vercel Blob |
| **Testing** | Vitest (unit) + Playwright (E2E) |
| **CI/CD** | GitHub Actions |
| **Deploy** | Vercel |

## Architecture

This project follows **Clean Architecture** principles to keep the domain logic decoupled from frameworks and external services:

```
src/
├── app/                    # Next.js routes (presentation)
│   ├── (auth)/            # /login, /register
│   ├── (shop)/            # /products, /brands, /cart, /checkout
│   ├── (account)/         # /profile, /orders, /addresses
│   ├── (admin)/           # /admin/products, /admin/orders, /admin/users
│   └── api/               # Webhooks (Wompi, etc.)
├── domain/                # Pure business logic (NO framework dependencies)
│   ├── entities/          # Domain types and factories
│   ├── repositories/      # Repository interfaces (ports)
│   └── use-cases/         # Business rules (TDD-tested)
├── infrastructure/        # External adapters
│   ├── db/                # Prisma client
│   ├── payment/           # Wompi client + signature verification
│   └── auth/              # NextAuth configuration
├── presentation/          # UI components and hooks
└── shared/                # Utils, types, constants
```

**Why this matters for portfolio:** It shows I understand separation of concerns, dependency inversion, and that domain logic is not coupled to Next.js or Prisma.

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- PostgreSQL database (or use [Neon](https://neon.tech) free tier)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/Andrejulian21/gamer-gear-co.git
cd gamer-gear-co

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your actual DATABASE_URL, NEXTAUTH_SECRET, WOMPI keys, etc.

# 4. Set up the database
pnpm prisma:generate
pnpm prisma:migrate

# 5. (Optional) Seed the database
pnpm prisma:seed

# 6. Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript compiler check |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:watch` | Run unit tests in watch mode |
| `pnpm test:e2e` | Run E2E tests (Playwright) |
| `pnpm format` | Format code with Prettier |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:migrate` | Run database migrations |
| `pnpm prisma:studio` | Open Prisma Studio |
| `pnpm prisma:seed` | Seed the database |

## Project Status

This is a **portfolio project in active development**. Current phase: **Phase 0 — Setup & Infrastructure**.

### Roadmap

- [x] **Phase 0** — Project setup, tooling, CI, README
- [ ] **Phase 1** — Database schema, NextAuth, role-based middleware
- [ ] **Phase 2** — Public catalog (browse, filter, search)
- [ ] **Phase 3** — Persistent cart with Zustand
- [ ] **Phase 4** — Checkout + Wompi payment integration + webhooks
- [ ] **Phase 5** — Admin panel (CRUD products, manage orders)
- [ ] **Phase 6** — User profile, addresses, order history
- [ ] **Phase 7** — Polish, SEO, screenshots, Lighthouse 90+
- [ ] **Phase 8** — Deploy to Vercel, configure production Wompi

## License

This project has **no license** — all rights reserved. The code is shared publicly for portfolio purposes, but please contact me before using it commercially.

## Author

**Andrejulian21**
- GitHub: [@Andrejulian21](https://github.com/Andrejulian21)
- LinkedIn: [Add your LinkedIn URL here]

---

Built with ❤️ for the Colombian gaming community
