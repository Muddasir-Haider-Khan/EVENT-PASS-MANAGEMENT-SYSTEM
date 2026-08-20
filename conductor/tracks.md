# Tracks Registry — EPMS Hardening & Rebuild

## Tracks

### [TRK-001] Track 1: Security Hardening & Data Integrity
- **Status**: `in_progress`
- **Spec**: Secure `/api/imagekit/upload`, conditional updates for `/api/gate/scan`, CSV formula sanitization, replace `Math.random()`, middleware session enforcement, security headers.

### [TRK-002] Track 2: Error Resilience, Boundaries & Test Scaffolding
- **Status**: `pending`
- **Spec**: Root `error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx`, Vitest setup, unit and concurrency integration specs.

### [TRK-003] Track 3: Design System & Mobile-First Responsive Rebuild
- **Status**: `pending`
- **Spec**: Install `lucide-react`, migrate inline styles to CSS tokens/Tailwind, UI components (`Button`, `Card`, `Input`, `Select`, `Badge`, `EmptyState`, `Skeleton`), viewport settings.

### [TRK-004] Track 4: Performance & Scalability
- **Status**: `pending`
- **Spec**: Cursor/page pagination on list endpoints, Prisma composite indexes.

### [TRK-005] Track 5: Accessibility (WCAG 2.2 AA) Audit & Pass
- **Status**: `pending`
- **Spec**: ARIA labels, focus states, multi-sensory scan feedback.

### [TRK-006] Track 6: Final Review & Quality Audit
- **Status**: `pending`
- **Spec**: Run `comprehensive-review-full-review` & `security-auditor` skills.
