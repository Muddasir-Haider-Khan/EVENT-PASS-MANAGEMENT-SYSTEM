# EVENT PASS MANAGEMENT SYSTEM — AGENTS & SKILLS CONFIGURATION

This project is equipped with the complete Antigravity Skill Vault from [rmyndharis/antigravity-skills](https://github.com/rmyndharis/antigravity-skills) and the complete UI/UX Design Intelligence Suite from [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), installed in `.agents/skills/` and registered globally.

## Active Skills Directory
- **Project Skills Path**: `.agents/skills/` (and `.agent/skills/`)
- **Global Skills Path**: `~/.gemini/skills/` & `~/.gemini/antigravity/skills/`
- **Total Installed Skills**: 314 modular skills

## Skill Categories & Activation Guidelines

### 1. UI/UX Pro Max & Design Intelligence (7 Skills)
- `ui-ux-pro-max`: AI-powered design intelligence with 192 reasoning profiles, 79 searchable UI styles, 74 font pairings, 119 UX guidelines, 105 icons, 17 GSAP presets, 25 chart types across 22 tech stacks.
  - **Search Tool**: `python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" [--domain <domain> | --design-system]`
- `ui-styling`: Rapid shadcn/ui and Tailwind CSS utility styling, theme config generators (`tailwind_config_gen.py`, `shadcn_add.py`).
- `design-system`: Design token architecture (primitive → semantic → component), token validation (`slide-token-validator.py`, `html-token-validator.py`).
- `design`: Corporate identity programs (CIP), brand assets, vector logos, icons, and presentation graphics.
- `brand`: Brand guidelines, brand tone of voice, design token synchronization (`sync_brand_to_tokens.py`).
- `banner-design`: Responsive banner layouts, social media cards, web heroes, and print dimensions.
- `slides`: Interactive HTML slide decks with Chart.js and tokenized themes.

### 2. Architecture & Design (30 Skills)
- `api-design-principles`, `backend-architect`, `database-architect`, `c4-architecture-c4-architecture`, `microservices-patterns`, `architecture-decision-records`, `design-pattern-expert`, `graphql-architect`, `event-driven-architecture`
- **Trigger**: System design, data modeling, ER diagrams, event schemas, API contracts (REST / GraphQL / gRPC), scaling strategies.

### 3. Full-Stack Development & Frameworks (37 Skills)
- `fastapi-pro`, `python-pro`, `nextjs-app-router-patterns`, `react-modernization`, `typescript-pro`, `nodejs-backend-patterns`, `tailwind-design-system`, `modern-frontend-developer`, `vue-pro`, `frontend-mobile-development-component-scaffold`
- **Trigger**: Building backend endpoints (pass generation, validation, QR codes, barcode logic, check-in APIs), frontend dashboards, attendee management interfaces, payment and ticketing flows.

### 4. Security & Compliance (57 Skills)
- `security-auditor`, `auth-implementation-patterns`, `jwt-sso-security`, `rbac-implementation-patterns`, `security-scanning-security-hardening`, `sast-configuration`, `owasp-top-10-remediation`, `data-privacy-gdpr-compliance`, `encryption-patterns`
- **Trigger**: Authentication & authorization, RBAC (admin, staff, attendee), ticket forgery prevention, QR token signing & cryptographic verification, tamper-proofing event passes.

### 5. Testing, QA & Verification (15 Skills)
- `unit-testing-test-generate`, `tdd-workflows-tdd-cycle`, `e2e-testing-patterns`, `api-testing-observability-api-mock`, `load-testing-k6`, `performance-benchmarking`
- **Trigger**: Automated test generation, unit tests, integration tests for pass check-in endpoints, load testing high-concurrency event entry gates.

### 6. Infrastructure, Cloud & DevOps (57 Skills)
- `kubernetes-architect`, `docker-compose-pro`, `helm-chart-scaffolding`, `terraform-module-library`, `cicd-automation-workflow-automate`, `github-actions-templates`, `aws-infrastructure-expert`, `cost-optimization`
- **Trigger**: Containerization (Dockerfile, docker-compose), CI/CD pipelines, cloud deployment (AWS/GCP/Azure), auto-scaling for peak registration/check-in loads.

### 7. Data, Analytics & AI (38 Skills)
- `postgresql-optimization`, `redis-caching-patterns`, `database-migration-alembic`, `elasticsearch-patterns`, `realtime-analytics`, `rag-implementation`
- **Trigger**: Real-time event check-in dashboards, high-speed attendance caching (Redis), transaction safety for ticket allocations.

### 8. Workflow, Conductor & Code Quality (12+38 Skills)
- `conductor-implement`, `conductor-new-track`, `code-review-ai-ai-review`, `code-refactoring-refactor-clean`, `codebase-cleanup-tech-debt`, `git-workflows`
- **Trigger**: Structured task planning, code reviews, PR preparation, technical debt management.

## Skill Activation Protocol
- Read `SKILL.md` in `.agents/skills/<skill-name>/` whenever executing tasks within a domain.
- Reference scripts in `.agents/skills/<skill-name>/scripts/` or documentation in `references/` when relevant.
