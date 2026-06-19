<!-- {{MANAGED_MARKER}} -->
# Cursor Instructions For LeadRat

Always load these repository documents before generating code:

{{LOAD_ORDER}}

AGENTS.md is authoritative and overrides every other instruction.

Cursor must:

- Inspect nearby existing implementations first.
- Reuse existing services, APIs, components, helpers, constants, models, and CSS.
- Avoid inline styles and duplicate CSS.
- Use existing Angular form, `ng-select`, modal, confirmation, and NgRx patterns.
- Prefer `getModuleListByAdvFilter()` for supported GET APIs.
- Keep changes scoped to the request.
- Avoid destructive git or filesystem actions unless the user explicitly requests them.
- If a matching `.ai-dev-assistant/tasks/*.md` file exists, read it after the required docs and use it as the Azure DevOps/Figma task brief.
