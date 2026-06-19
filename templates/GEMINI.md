<!-- {{MANAGED_MARKER}} -->
# Gemini Instructions For LeadRat

Read the following files first, in order:

{{LOAD_ORDER}}

AGENTS.md has the highest priority. Never ignore it and never replace it.

When working in this repository:

- Search before implementing.
- Reuse existing Angular architecture and shared code.
- Never duplicate services, APIs, common utilities, components, directives, pipes, constants, enums, or models.
- Never use inline CSS.
- Use existing confirmation popup patterns for destructive actions.
- Use timezone utilities for date/time work.
- Keep changes minimal and production-ready.
- If `.ai-dev-assistant/tasks/*.md` exists for the current request, read it after the required docs and use it as the Azure DevOps/Figma task brief.
