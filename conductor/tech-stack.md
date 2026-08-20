# Tech Stack — EPMS

## Framework & Core
- **Framework**: Next.js 14.2.35 (App Router, Server & Client Components)
- **Language**: TypeScript (`strict: true`)
- **Database**: PostgreSQL (Neon Cloud) via Prisma 6.19 ORM
- **Styling**: Tailwind CSS 3.4 + Custom CSS Custom Properties (`globals.css`)
- **Icons**: Lucide React

## Integrations
- **Email**: Resend API
- **Asset Storage & CDN**: ImageKit Node SDK & Client API
- **QR Engine**: `qrcode` (Generation), `html5-qrcode` (Browser Scanner)
- **Authentication**: JWT, bcryptjs (12 salt rounds), httpOnly Secure Cookies

## QA & Tooling
- **Testing**: Vitest / Jest, `@testing-library/react`, Playwright
- **Deployment**: Vercel Serverless Architecture
