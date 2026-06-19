<!-- {{MANAGED_MARKER}} -->
# Roo Instructions For LeadRat

Load order:

{{LOAD_ORDER}}

AGENTS.md is authoritative and must never be overwritten.

Implementation rules:

- Understand existing code before editing.
- Search for reusable services, APIs, utilities, models, constants, components, directives, and pipes.
- Never duplicate business logic or API logic.
- Never use inline CSS.
- Reuse existing Angular form, modal, table, dropdown, and confirmation patterns.
- Prefer `getModuleListByAdvFilter()` for supported GET APIs.
- Keep changes minimal, typed, maintainable, and aligned with nearby code.
- If `.ai-dev-assistant/tasks/*.md` exists for the current request, read it after the required docs and use it as the Azure DevOps/Figma task brief.
