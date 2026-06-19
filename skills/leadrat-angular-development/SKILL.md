---
name: leadrat-angular-development
description: Use when working on the LeadRat Angular CRM repository, adding features, fixing UI, changing APIs, generating docs, or guiding AI assistants. Enforces AGENTS.md rules, project architecture, reusable services/components, CSS conventions, form-field standards, GET API reuse, NgRx patterns, and safe minimal changes.
metadata:
  version: 1.0.0
---

# LeadRat Angular Development Skill

This skill teaches an AI assistant how to work safely in the LeadRat Angular repository.

## Mandatory Load Order

Before writing code, planning code, reviewing code, or generating documentation, load:

1. `AGENTS.md`
2. `PROJECT.md`
3. `ARCHITECTURE.md`
4. `COMMON_SERVICES.md`
5. `COMPONENTS.md`
6. `API_GUIDELINES.md`

`AGENTS.md` is always highest priority. If another document conflicts with it, follow `AGENTS.md`.

## Core Behaviour

- Understand existing code before coding.
- Search similar implementations first.
- Follow existing architecture, folder structure, naming, style, formatting, and patterns.
- Keep changes minimal and focused.
- Preserve user changes already present in the working tree.
- Do not revert unrelated changes.

## Azure DevOps And Figma Task Briefs

When `.ai-dev-assistant/tasks/*.md` exists for the current request:

- Read the relevant task brief after the mandatory load order.
- Treat Azure DevOps content as the requirement source.
- Treat Figma content as visual reference, not permission to invent a new design system.
- Implement Figma UI with existing LeadRat CSS classes, shared components, form patterns, tables, modals, spacing, and typography.
- Do not store Azure DevOps PATs or Figma tokens in files. Use environment variables only.

## Project Structure

- Angular 14 application.
- Feature modules: `src/app/features`.
- NgRx domains: `src/app/store`.
- Domain API wrappers: `src/app/services/controllers`.
- Shared HTTP utilities: `src/app/services/shared/common.service.ts`.
- Cross-cutting guards, interceptors, interfaces, helpers: `src/app/core`.
- Reusable components, directives, pipes: `src/app/shared`.
- Global SCSS: `src/styles/components` and `src/styles/utilities`.

## Build And Test

Use only package scripts:

- `npm start`
- `npm run build`
- `npm run build:dev`
- `npm run build:qa`
- `npm run build:prod`
- `npm run watch`
- `npm test`

Single spec:

```bash
npx ng test --include=src/app/path/file.component.spec.ts
```

## CSS Rules

- Never use inline CSS.
- Never create unnecessary custom CSS.
- Search existing CSS classes before adding new classes.
- Reuse utility classes and existing component classes.
- New CSS must follow existing naming and organization.
- Preserve existing UI/UX unless explicitly asked to redesign.

## Form Field Rules

Every editable form field must use `form-errors-wrapper`.

Use:

- `field-label-req` for required labels.
- `field-label` for optional labels.
- `ng-select` for dropdown/selectable fields.
- `ResizableDropdown`, `virtualScroll`, `bindLabel`, `bindValue`, existing dropdown classes, and existing dropdown positioning patterns where applicable.

Do not:

- Use native `select`.
- Create custom dropdowns.
- Add manual Required/Optional badges when labels already communicate requirement.
- Let long dropdown panels be clipped by containers.

## Search Before Creating

Before creating any utility, helper, constant, enum, interface, model, service, directive, pipe, component, or function, search:

- Common utilities
- Shared utilities
- `src/app/app.constants.ts`
- `src/app/app.enum.ts`
- Common services
- Shared services
- Shared models
- Existing components
- Existing helper functions

If it already exists, import and reuse it.

## API Rules

Before creating any GET API, check whether it can use:

```ts
getModuleListByAdvFilter()
```

Default to this method for most GET APIs.

Only create a new GET implementation if this method cannot support the requirement.

Never duplicate API logic or service methods.

## Date And Time

Before date/time work, check:

- `src/app/core/utils/common.util.ts`
- `src/app/app.constants.ts`
- Shared helper functions

Timezone handling is mandatory. Reuse helpers such as:

- `getTimeZoneDate`
- `setTimeZoneDate`
- `patchTimeZoneDate`
- `setTimeZoneDateWithTime`
- `patchTimeZoneWithTime`
- `convertToUtc`
- `convertToLocalTime`
- `setTimeZoneTime`
- `getTimeZoneTime`
- `getSystemTimeOffset`
- `getSystemTimeZoneId`

Do not rely on raw browser-local `Date` behavior for stored, API, compared, filtered, or displayed values.

## Confirmation Dialogs

For delete, remove, reset, clear, archive, or permanent delete:

- Use the existing confirmation popup.
- Use `UserConfirmationComponent` through `BsModalService`.
- Do not create another confirmation dialog.

## Memory Leaks

Always unsubscribe properly.

Use existing patterns like:

- `stopper`
- `destroy$`
- `takeUntil`

Avoid nested subscriptions when possible.

## Getter Methods

Getters should only return values.

Do not put filtering, mapping, sorting, business logic, heavy calculations, or API calls inside getters.

## Strong Typing

Avoid `any`.

Prefer interfaces, models, enums, and generic types.

Every API response, method parameter, and return type should be properly typed.

## Error Handling

Always handle:

- API failures
- Empty responses
- Null values
- Undefined values
- Invalid data

Use existing notification/error handling patterns.

Never fail silently.

## Performance

Avoid duplicate API calls, unnecessary subscriptions, expensive getters, heavy template calculations, unnecessary loops, and duplicate change detection.

## Final Checklist

Before finishing:

- Existing architecture is followed.
- Existing coding style is maintained.
- Existing CSS is reused.
- Existing utilities and services are reused.
- `getModuleListByAdvFilter()` is used for GET APIs whenever applicable.
- Date/time utilities are reused.
- No duplicated code/API/CSS exists.
- No memory leaks exist.
- No complex getters exist.
- No unnecessary `any` exists.
- No hardcoded values exist.
- Existing confirmation popup is used.
- Code is clean, reusable, maintainable, and production-ready.

## Golden Rule

Never invent a new pattern if an existing one already exists.

Search first. Reuse first. Match the project.
