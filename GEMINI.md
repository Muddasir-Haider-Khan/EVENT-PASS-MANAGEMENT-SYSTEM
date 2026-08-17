# GEMINI PROJECT RULES — EVENT PASS MANAGEMENT SYSTEM

## Active Customizations & Skills
- All skills from `rmyndharis/antigravity-skills` (307 skills) and `nextlevelbuilder/ui-ux-pro-max-skill` (7 skills, total 314 skills) are installed in `.agents/skills/` and registered in `.agents/skills.json`.
- Global skills are available in `~/.gemini/skills/` and `~/.gemini/antigravity/skills/`.

## Execution Standards
1. **Design Excellence**: Use `ui-ux-pro-max` search tooling (`python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system`) to formulate design systems, typography pairings, accessible palettes, and component hierarchy.
2. **Skill Utilization**: Whenever tackling architecture, backend, frontend, security, database, DevOps, or testing tasks, reference the relevant skill instruction file located in `.agents/skills/<skill-name>/SKILL.md`.
3. **Security by Design**: Implement robust cryptographic verification for passes/QR codes, JWT/RBAC for access control, and strict input validation.
4. **Quality & Testing**: Ensure test coverage for core business logic (pass creation, validation, gate check-in, revocation).
