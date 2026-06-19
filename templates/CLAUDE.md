<!-- {{MANAGED_MARKER}} -->
# Claude Instructions For LeadRat

Before answering, reading, planning, or editing code, load and follow these files in order:

{{LOAD_ORDER}}

AGENTS.md is the source of truth. If any generated document conflicts with AGENTS.md, AGENTS.md wins.

Mandatory behaviour:

- Search the codebase before creating utilities, services, APIs, components, models, directives, pipes, constants, enums, or helpers.
- Reuse existing CSS classes and shared UI patterns.
- Never use inline CSS.
- Use `form-errors-wrapper` for editable form controls.
- Use `ng-select` for selectable/dropdown fields.
- Reuse `getModuleListByAdvFilter()` for GET APIs whenever it can support the requirement.
- Follow the existing Angular, NgRx, folder, naming, subscription cleanup, and error handling patterns.
- Preserve existing user changes and keep edits minimal.

Generated knowledge documents:

{{DOC_LIST}}
