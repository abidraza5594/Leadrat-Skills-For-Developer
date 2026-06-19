# LeadRat AI Developer Assistant

Production-ready internal AI onboarding toolkit for LeadRat Angular projects.

This package installs AI assistant configuration and generates project knowledge documents so Claude, Cursor, Gemini, Copilot, Cline, Continue, Roo, Codex-style agents, and future MCP-based tools can understand the LeadRat repository quickly and safely.

## What This Installs

The assistant installs or updates managed AI config files in a LeadRat repository:

- `CLAUDE.md`
- `CURSOR.md`
- `GEMINI.md`
- `.github/copilot-instructions.md`
- `.cursor/rules/leadrat-ai.mdc`
- `.clinerules`
- `continue.config.json`
- `roo.md`

It also generates AI knowledge docs:

- `PROJECT.md`
- `ARCHITECTURE.md`
- `COMMON_SERVICES.md`
- `COMPONENTS.md`
- `API_GUIDELINES.md`
- `BUSINESS_RULES.md`
- `STORE.md`
- `MODELS.md`
- `ROUTES.md`
- `COMMON_UTILS.md`
- `ERROR_HANDLING.md`
- `CHECKLIST.md`

## Highest Priority Rule

`AGENTS.md` in the target LeadRat repository is always the source of truth.

Every generated AI configuration tells assistants to read these files first, in this order:

1. `AGENTS.md`
2. `PROJECT.md`
3. `ARCHITECTURE.md`
4. `COMMON_SERVICES.md`
5. `COMPONENTS.md`
6. `API_GUIDELINES.md`

If any generated document conflicts with `AGENTS.md`, `AGENTS.md` wins.

## Install Directly From GitHub

Run these commands from the LeadRat project root, not from this assistant repository.

```bash
npx --yes github:abidraza5594/Leadrat-Skills-For-Developer init
```

Then scan the Angular project and generate docs:

```bash
npx --yes github:abidraza5594/Leadrat-Skills-For-Developer learn
```

Validate installation:

```bash
npx --yes github:abidraza5594/Leadrat-Skills-For-Developer doctor
```

## Install As A Dev Dependency

Run from the LeadRat project root:

```bash
npm install --save-dev github:abidraza5594/Leadrat-Skills-For-Developer
```

Use the installed binary:

```bash
npx leadrat-dev-assistant init
npx leadrat-dev-assistant learn
npx leadrat-dev-assistant doctor
```

Short binary alias:

```bash
npx dev-assistant update
```

## Step-By-Step Usage

1. Open the LeadRat Angular repository.

```bash
cd "C:\LeadRat CRM\Clone 2\Leadrat-Black-Web"
```

2. Confirm `AGENTS.md` exists.

```bash
dir AGENTS.md
```

3. Install assistant configs.

```bash
npx --yes github:abidraza5594/Leadrat-Skills-For-Developer init
```

4. Learn the project.

```bash
npx --yes github:abidraza5594/Leadrat-Skills-For-Developer learn
```

5. Check health.

```bash
npx --yes github:abidraza5594/Leadrat-Skills-For-Developer doctor
```

6. After code changes, refresh generated docs while preserving custom notes.

```bash
npx --yes github:abidraza5594/Leadrat-Skills-For-Developer update
```

7. Remove generated AI files only when needed.

```bash
npx --yes github:abidraza5594/Leadrat-Skills-For-Developer clean
```

`clean` never removes `AGENTS.md`.

## Commands

### init

Installs AI configuration files and seed docs.

```bash
npx leadrat-dev-assistant init
```

Useful options:

- `--yes` skips prompts.
- `--force` overwrites managed assistant files.
- `--dry-run` shows intended changes without writing files.
- `--root <path>` runs against a specific repository root.

### learn

Scans the Angular project using TypeScript AST analysis and generates docs.

```bash
npx leadrat-dev-assistant learn
```

Detected items include:

- Components
- Services
- Controllers
- Models
- Interfaces
- Enums
- Constants
- Shared utilities
- Pipes
- Directives
- Guards
- Interceptors
- NgRx store
- Routes
- API usages

### doctor

Validates the assistant setup.

```bash
npx leadrat-dev-assistant doctor
```

Checks:

- Missing docs
- Missing AI config
- Missing `AGENTS.md`
- Invalid `.ai-dev-assistant` folder structure
- Outdated docs after source changes

CI-friendly command:

```bash
npx leadrat-dev-assistant doctor --strict --json
```

### update

Refreshes generated docs and managed AI configs while preserving custom notes.

```bash
npx leadrat-dev-assistant update
```

### sync

Syncs documentation from GitHub.

```bash
npx leadrat-dev-assistant sync --repo abidraza5594/Leadrat-Skills-For-Developer --ref main --path docs
```

For private repositories:

```bash
set GITHUB_TOKEN=your_token
npx leadrat-dev-assistant sync --repo owner/private-repo
```

### clean

Removes generated assistant files only.

```bash
npx leadrat-dev-assistant clean
```

Files are removed only when they contain the managed marker unless `--force` is used.

## Agent Skill

This repository includes a reusable agent skill:

```text
skills/leadrat-angular-development/SKILL.md
```

Use it for agents that support skill loading. The skill contains the detailed LeadRat development rules from `AGENTS.md`, including:

- Read `AGENTS.md` first.
- Search existing code before implementing.
- Reuse existing CSS.
- Never use inline CSS.
- Use `form-errors-wrapper`.
- Use `ng-select`.
- Reuse `getModuleListByAdvFilter()` for GET APIs whenever applicable.
- Follow Angular and NgRx architecture.
- Reuse common services and utilities.
- Use timezone helpers for date/time.
- Use existing confirmation popup patterns.
- Prevent memory leaks.
- Keep changes minimal.

## Local Development

```bash
npm install
npm run build
npm test
```

Run the CLI locally:

```bash
node bin/dev-assistant.cjs --help
```

Run against a LeadRat repo:

```bash
node bin/dev-assistant.cjs learn --root "C:\LeadRat CRM\Clone 2\Leadrat-Black-Web"
```

## Notes

- `AGENTS.md` is never overwritten.
- Generated docs use managed sections.
- Custom notes outside generated sections are preserved.
- Runtime production audit is expected to be clean with `npm audit --omit=dev`.
