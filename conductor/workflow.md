# Workflow — EPMS

## Development Methodology
- **Track-Based Incremental Execution**: Work is structured into phased tracks (`conductor/tracks.md`).
- **TDD & Safety Gates**: Critical business paths (gate scanner concurrency, authentication, rate-limiting, Zod parsing) must have unit/integration test coverage.
- **Verification Protocol**: Each track requires `npx tsc --noEmit` and `npm run build` verification before closing.
