# Event Pass Management System (EPMS)

Production-grade, multi-tenant event registration and QR-based gate access control platform.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: Neon (Serverless Postgres) via Prisma ORM
- **Auth**: Custom JWT sessions (httpOnly cookies), 3 scopes: Super Admin / Event Manager / Gate
- **Email**: Resend with React Email templates
- **Images**: ImageKit.io
- **QR**: `qrcode` (server-side generation), `html5-qrcode` (camera scanning)
- **Hosting**: Vercel with wildcard subdomain routing

## Architecture

| Subdomain | Purpose |
|---|---|
| `epms.27mediaagency.com` | Super Admin + Event Manager login & dashboard |
| `gate.27mediaagency.com` | Gate operator OTP entry + QR scanning |
| `{slug}.27mediaagency.com` | Public event registration form |

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

### 3. Setup Database

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

### Local Development Routing

Since subdomains don't work on localhost, use query parameters:
- `http://localhost:3000` → EPMS (Super Admin + Manager login)
- `http://localhost:3000/gate?subdomain=gate` → Gate portal
- `http://localhost:3000/event/your-slug?subdomain=your-slug` → Public form

### 5. Deploy to Vercel

```bash
vercel --prod
```

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # Data model
│   └── seed.ts                # Super admin seeding
├── src/
│   ├── middleware.ts           # Host-header subdomain routing
│   ├── app/
│   │   ├── login/             # Unified login page
│   │   ├── admin/             # Super Admin dashboard
│   │   ├── manager/           # Event Manager dashboard
│   │   ├── gate/              # Gate OTP + scanner
│   │   ├── event/[slug]/      # Public registration form
│   │   └── api/               # All API routes
│   ├── lib/                   # Core libraries
│   │   ├── auth.ts            # JWT + bcrypt + sessions
│   │   ├── db.ts              # Prisma client
│   │   ├── imagekit.ts        # Image upload/delete
│   │   ├── qr.ts              # QR code generation
│   │   ├── rate-limit.ts      # Rate limiting
│   │   ├── resend.ts          # Email sending
│   │   └── validation.ts      # Zod schemas
│   └── components/            # Shared UI components
└── .env.example               # Environment variable template
```

## Key Features

- **Multi-tenant**: Each event gets its own branding, form, and access controls
- **QR Entry/Exit**: Full state machine (NOT_ENTERED → INSIDE → EXITED → INSIDE…)
- **Hardware Scanner Support**: Hidden input captures barcode scanner "keyboard" input
- **Camera Fallback**: Works on phones/laptops without a scanner
- **Audit Trail**: Every scan is logged with participant, gate, result, and timestamp
- **Cascading Deletes**: Event deletion removes all data + ImageKit assets
- **Rate Limiting**: Login, OTP, and form submission endpoints are protected
