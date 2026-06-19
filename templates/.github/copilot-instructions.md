<!-- {{MANAGED_MARKER}} -->
# GitHub Copilot Instructions For LeadRat

Copilot must treat `AGENTS.md` as the highest-priority instruction document.

Before suggesting code, load:

{{LOAD_ORDER}}

Project rules:

- Search for existing implementations before creating anything new.
- Reuse existing CSS classes and avoid inline CSS.
- Reuse shared components and `form-errors-wrapper`.
- Use `ng-select` for dropdowns and selectable fields.
- Reuse existing services and `getModuleListByAdvFilter()` for compatible GET APIs.
- Follow existing Angular module, NgRx, folder, naming, and cleanup patterns.
- Keep changes small and preserve existing worktree changes.
