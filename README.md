# MatrimonyOS

> **Global, Privacy-First Matrimonial Matchmaking SaaS Platform**  
> Serving conscious individuals and families across Bangladesh, the United Kingdom, the United States, Canada, Europe, the Middle East, and the global diaspora.

---

## 1. Project Overview

**MatrimonyOS** is a modular monolith software platform engineered for high-trust, privacy-conscious matchmaking. Designed to replace outdated, intrusive matrimonial websites, MatrimonyOS combines modern privacy tiers, family involvement mechanics, multi-currency global transactions, and algorithmically guided compatibility.

### Primary Objectives
1. **Commercial Scalability**: Build a sustainable, monetizable SaaS business.
2. **Technical Excellence**: Serve as an international enterprise-grade portfolio demonstrating senior full-stack craftsmanship.
3. **Privacy by Design**: Safeguard user biodata, photos, and identities through granular consent-based access tiers.

---

## 2. Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) + React 19 | Server Components, Suspense, Turbopack, Tailwind CSS v4, Lucide |
| **Backend** | Next.js Server Actions & Route Handlers | Modular Monolith, Node.js runtime, `server-only` isolation |
| **Database** | PostgreSQL on Neon Cloud | Serverless autoscaling Postgres with connection pooling |
| **ORM** | Prisma 7.10.0 | `@prisma/adapter-pg` driver adapter, explicit `prisma.config.ts` |
| **Validation** | Zod | Runtime environment variables & input validation |
| **Package Manager**| pnpm v12 | Workspace package management & reproducible locks |
| **Code Quality** | ESLint + Prettier | Strict typing, Tailwind class sorting, zero lint warnings |
| **Deployment** | Vercel | Production edge CDN with Node.js runtime functions |

---

## 3. High-Level Modular Monolith Architecture

The codebase follows a Domain-Driven Modular Monolith structure within `src/modules`:

```
src/
├── app/                      # Next.js App Router route groups & layouts
│   ├── (auth)/login/         # Authentication views
│   ├── (dashboard)/dashboard/# Authenticated user portal
│   ├── (marketing)/          # Landing page & public funnel
│   ├── admin/                # Platform management & moderation
│   ├── super-admin/          # Tenancy & multi-region config
│   ├── api/health/           # Runtime health inspection endpoint
│   ├── layout.tsx            # Root application layout
│   └── globals.css           # Tailwind CSS design system tokens
├── components/
│   ├── ui/                   # Primitive design system components (buttons, badges)
│   ├── shared/               # Cross-cutting UI components
│   ├── forms/                # Form controls & validators
│   └── layouts/              # Section wrappers & shells
├── modules/                  # Isolated domain business modules
│   ├── auth/                 # Identity, OAuth, session management
│   ├── users/                # User accounts & privacy settings
│   ├── profiles/             # Biodata, lifestyle, family background, photos
│   ├── discovery/            # Multi-parameter search & geographical corridors
│   ├── matching/             # Compatibility scoring algorithms
│   ├── interests/            # Proposals & interest lifecycle state machine
│   ├── messaging/            # Secure communications & guardian access
│   ├── subscriptions/        # Membership tiers & quota management
│   ├── payments/             # Multi-currency payment gateway integrations
│   ├── notifications/        # Transactional email, SMS, push alerts
│   ├── verification/         # NID/Passport verification & badges
│   └── admin/                # Moderation workflows & audit logs
├── server/                   # Backend core primitives
│   ├── db.ts                 # Prisma singleton with PostgreSQL driver adapter
│   ├── repositories/         # Database access abstractions
│   ├── services/             # Cross-module domain service orchestrators
│   ├── policies/             # Access control & authorization gates
│   └── utils/                # Error hierarchies (AppError) & helpers
├── lib/
│   ├── constants.ts          # Central application constants & regional configs
│   ├── env.ts                # Zod environment variable schema & validator
│   └── prisma.ts             # Server database client re-export
├── hooks/                    # Reusable React client hooks
├── types/                    # Global TypeScript interfaces & DTOs
└── generated/
    └── prisma/               # Custom-generated Prisma 7 client
```

---

## 4. Environment Setup

### 4.1 Prerequisites
- **Node.js**: v20+ (v24 LTS recommended)
- **pnpm**: v12+ (`npm install -g pnpm`)
- **Git**: v2.40+

### 4.2 Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd MatrimonyOs

# Install dependencies using pnpm
pnpm install
```

### 4.3 Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
# Environment Mode
NODE_ENV="development"

# Neon PostgreSQL Database Credentials
DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/[database]?sslmode=require"
DIRECT_URL="postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/[database]?sslmode=require"

# Application Authentication Secret (minimum 32 characters)
AUTH_SECRET="your-super-secret-auth-key-min-32-characters-for-security"

# Application Public URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 5. Neon PostgreSQL Setup Guide

To obtain your actual Neon PostgreSQL cloud database credentials:

1. **Create an Account**: Go to [https://console.neon.tech](https://console.neon.tech) and sign up/sign in.
2. **Create a Project**: Click **Create Project**, name it `matrimonyos`, and select your nearest region (e.g., `AWS us-east-2` or `eu-central-1`).
3. **Get Connection Strings**:
   - In the project dashboard, locate the **Connection Details** card.
   - Select **Pooled connection** and copy the string into `DATABASE_URL` in your `.env`.
   - Select **Direct connection** (unpooled) and copy the string into `DIRECT_URL` in your `.env`.
4. **Generate Prisma Client**:
   ```bash
   pnpm db:generate
   ```
5. **Run Migrations** (when ready to push schema):
   ```bash
   pnpm db:migrate
   ```

> [!NOTE]
> Database connections are initialized lazily. If valid Neon credentials are not yet supplied, the system operates in placeholder mode and the `/api/health` endpoint gracefully reports `placeholder_credentials`.

---

## 6. Development Commands

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Start the local Next.js development server with Turbopack |
| `pnpm build` | Build the optimized production application |
| `pnpm start` | Run the compiled production application server |
| `pnpm lint` | Execute ESLint across all codebase files |
| `pnpm typecheck` | Run the TypeScript compiler check (`tsc --noEmit`) |
| `pnpm format` | Check formatting with Prettier |
| `pnpm format:fix`| Automatically fix formatting with Prettier |
| `pnpm db:generate`| Generate Prisma 7 Client into `src/generated/prisma` |
| `pnpm db:migrate` | Apply schema migrations to your Neon database |
| `pnpm db:studio` | Launch Prisma Studio GUI for database inspection |

---

## 7. Verification & Health Check

The platform exposes an automated health endpoint:

```http
GET /api/health
```

Sample Response:
```json
{
  "status": "healthy",
  "application": {
    "name": "MatrimonyOS",
    "version": "0.1.0",
    "environment": "development",
    "uptimeSeconds": 42,
    "timestamp": "2026-11-02T02:26:16.902Z"
  },
  "database": {
    "configured": true,
    "provider": "neon-postgresql",
    "status": "connected",
    "message": "Successfully connected to Neon PostgreSQL database."
  }
}
```

---

## 8. Git Workflow & Security Policy

1. **Never Commit Secrets**: `.env`, `.env.*.local`, and private certificates are strictly gitignored.
2. **Branching Model**:
   - `main`: Production-ready code.
   - `develop`: Integration branch for completed feature phases.
   - `feature/phase-X`: Active phase development branches.
3. **Pre-Push Checklist**:
   - `pnpm typecheck` returns 0 errors.
   - `pnpm lint` returns 0 warnings.
   - `pnpm build` completes successfully.

---

## 9. Next Steps (Upcoming Phase 2)
- **Phase 2**: Authentication & Identity System (Auth.js / NextAuth, email verification, session management, user roles).
- **Phase 3**: User Profiles & Privacy Tiers (Biodata schema, multi-step profile builder, guardian access controls).
- **Phase 4**: Discovery Engine & Compatibility Matching.
- **Phase 5**: Interests Lifecycle, Proposals & Real-time Messaging.
- **Phase 6**: Subscriptions, Multi-Currency Billing & Production Deployment.
