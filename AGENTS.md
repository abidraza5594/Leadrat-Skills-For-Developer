# LeadRat AI Developer Assistant Guidelines

These rules apply to every AI assistant, developer, or automation working with LeadRat code through this package.

`AGENTS.md` in the target LeadRat repository is always the highest-priority instruction document. This package must never overwrite it.

## Required Reading Order

Before generating code, every supported AI assistant must load:

1. `AGENTS.md`
2. `PROJECT.md`
3. `ARCHITECTURE.md`
4. `COMMON_SERVICES.md`
5. `COMPONENTS.md`
6. `API_GUIDELINES.md`

If any generated document conflicts with `AGENTS.md`, `AGENTS.md` wins.

## Project Structure

LeadRat is an Angular 14 application.

- Lazy-routed feature modules live in `src/app/features`.
- NgRx domains live in `src/app/store`.
- Domain API wrappers live in `src/app/services/controllers`.
- Shared HTTP utilities live in `src/app/services/shared/common.service.ts`.
- Cross-cutting guards, interceptors, interfaces, and helpers live in `src/app/core`.
- Reusable components, directives, and pipes live in `src/app/shared`.
- Global SCSS is under `src/styles/components` and `src/styles/utilities`.

## Build And Test Commands

Use commands from `package.json` only:

- `npm start`
- `npm run build`
- `npm run build:dev`
- `npm run build:qa`
- `npm run build:prod`
- `npm run watch`
- `npm test`

To run one spec:

```bash
npx ng test --include=src/app/path/file.component.spec.ts
```

## Coding Style

- Follow `.editorconfig`.
- Use UTF-8.
- Use 2-space indentation.
- Keep final newline.
- Trim trailing whitespace.
- Use single quotes in TypeScript.
- Avoid `any` unless an existing external API shape makes it unavoidable.
- Keep formatting consistent with nearby files.

## Understand Existing Code First

Never start coding immediately.

Before any change:

- Understand how existing implementation works.
- Search for similar components, services, utilities, models, modules, and helpers.
- Follow existing architecture, folder structure, style, naming, formatting, and patterns.

Every new implementation should look like it was originally written by the LeadRat developers.

## Reuse Existing CSS

- Never use inline CSS.
- Never create unnecessary custom CSS.
- Search for existing CSS classes before creating new ones.
- Reuse existing utility classes wherever possible.
- If a new class is required, follow existing naming, file organization, and styling patterns.
- Preserve the existing visual system.

## Form Field Rules

Every editable form field must use `form-errors-wrapper`.

Rules:

- Pass the related form control through the `control` input.
- Provide the correct label for validation messages.
- Use `field-label-req` for required field labels.
- Use `field-label` for optional field labels.
- Do not manually add Required or Optional badges when existing label patterns communicate the requirement.
- Use `ng-select` for every dropdown or selectable option field.
- Do not use native `select`.
- Do not create custom dropdowns.
- Reuse existing `ng-select` patterns: `ResizableDropdown`, `virtualScroll`, `bindLabel`, `bindValue`, dropdown positioning, and existing classes.
- For long option lists, enable virtual scrolling and make sure dropdown panels are not clipped.

## Search Before Creating

Before creating any:

- Utility
- Helper
- Constant
- Enum
- Interface
- Model
- Service
- Directive
- Pipe
- Component
- Function

Search the project first.

Especially check:

- Common utilities
- Shared utilities
- `src/app/app.constants.ts`
- `src/app/app.enum.ts`
- Common services
- Shared services
- Shared models
- Existing components
- Existing helper functions

If an implementation exists:

- Import it.
- Reuse it.
- Never duplicate logic.

## Date And Time Handling

Before implementing date or time functionality, check:

- `src/app/core/utils/common.util.ts`
- `src/app/app.constants.ts`
- Shared helper functions

Timezone handling is mandatory for date, time, calendar, duration, reminder, schedule, filter, or timestamp work.

Always consider tenant, user, or base UTC offset.

Reuse helpers such as:

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

Do not rely on raw browser-local `Date` behavior when values are stored, sent to APIs, compared, filtered, or displayed across timezones.

Never duplicate date formatting or conversion logic.

## GET API Rule

Before creating any new GET API implementation, check whether it can use:

```ts
getModuleListByAdvFilter()
```

This should be the default approach for most GET APIs.

Pass required configuration such as:

- `path`
- Request parameters
- Query parameters
- Filter object
- Sorting
- Pagination
- Other required options

Only create a new GET implementation if `getModuleListByAdvFilter()` cannot support it.

Never duplicate GET request logic across services.

Always prefer the common service.

## DRY

Never duplicate business logic.

If similar functionality exists:

- Reuse it.
- Extend it if necessary.
- Create reusable methods.
- Create reusable components.
- Create reusable services.
- Create reusable utilities.

Every implementation should reduce duplication.

## Clean Code

Code must be:

- Clean
- Readable
- Modular
- Reusable
- Scalable
- Easy to debug
- Easy to maintain

Avoid unnecessary complexity.

Prefer simple readable solutions.

## Prevent Memory Leaks

Always:

- Unsubscribe properly.
- Follow existing subscription management patterns such as `stopper` or `destroy$` with `takeUntil`.
- Use existing destroy lifecycle implementation.
- Avoid nested subscriptions whenever possible.
- Never leave active subscriptions running.

## Getter Rules

Getter methods should only return values.

Do not perform:

- Filtering
- Mapping
- Sorting
- Business logic
- Heavy calculations
- API calls

Move complex logic into reusable methods.

## Confirmation Popup

For destructive actions like delete, remove, reset, clear, archive, or permanent delete:

- Use the existing confirmation popup.
- Use `UserConfirmationComponent` through `BsModalService` where confirmation is required.
- Never create another confirmation dialog.

## Component Patterns

Before creating a component:

- Check similar components.
- Follow the same folder structure.
- Follow the same lifecycle usage.
- Follow the same dependency injection style.
- Follow the same event handling.
- Follow the same HTML structure.
- Follow the same TypeScript organization.
- Follow the same naming conventions.

Consistency is more important than preference.

## API Duplication

Before creating API methods, service methods, or repository methods:

- Search for similar functionality.
- Reuse existing services whenever possible.
- Never duplicate APIs.

## Keep Components Small

Each component should have a single responsibility.

If a component becomes too large:

- Extract child components.
- Move business logic into services.
- Move reusable logic into utilities.

## Respect Folder Structure

- Never create unnecessary folders.
- Never move files without a valid architectural reason.
- Place new files beside similar existing implementations.

## Naming Conventions

Maintain consistency for:

- Components
- Services
- Models
- Interfaces
- Enums
- Constants
- Variables
- Methods
- Observables
- Files
- CSS classes

Never introduce a different naming style.

## Avoid Hardcoded Values

Never hardcode:

- API URLs
- Strings
- Labels
- Date formats
- Keys
- Magic numbers
- Configuration values

Use:

- Constants
- Enums
- Config files
- Shared helpers
- Environment files
- Translation keys where surrounding code uses translations

## Preserve UI/UX

Do not redesign UI unless explicitly requested.

Maintain:

- Layout
- Spacing
- Colors
- Typography
- Icons
- Buttons
- Dialogs
- Loading indicators
- Notifications
- Error messages

New UI should blend with the existing application.

## Error Handling

Always handle:

- API failures
- Empty responses
- Null values
- Undefined values
- Invalid data

Use the project existing notification and error handling system.

Never fail silently.

## Performance

Avoid:

- Duplicate API calls
- Unnecessary subscriptions
- Heavy template calculations
- Expensive getters
- Unnecessary loops
- Duplicate change detection
- Duplicate computations

Prefer optimized scalable implementations.

## Strong Typing

Avoid `any`.

Prefer:

- Interfaces
- Models
- Enums
- Generic types

Every API response, method parameter, and return type should be properly typed.

## Git Changes

- Only modify files related to the requested task.
- Avoid unrelated formatting.
- Avoid unrelated refactoring.
- Avoid renaming files without reason.
- Do not revert user changes.
- Preserve existing worktree changes.

## Final Checklist

Before finishing, verify:

- Existing architecture is followed.
- Existing coding style is maintained.
- Existing CSS is reused.
- Existing utilities are reused.
- Existing services are reused.
- `getModuleListByAdvFilter()` is used for GET APIs whenever applicable.
- Date/time utilities are reused.
- No duplicated code exists.
- No duplicated API logic exists.
- No duplicated CSS exists.
- No memory leaks exist.
- No complex getters exist.
- No unnecessary `any` types exist.
- No hardcoded values exist.
- Existing confirmation popup is used.
- Code is clean.
- Code is reusable.
- Code is maintainable.
- Code is production-ready.

## Testing

Tests use Jasmine/Karma through `karma.conf.js`.

Coverage output is written to `coverage/lr-black`.

Add focused specs beside changed Angular units when behavior changes.

Run `npm test` or a single spec command when practical.

## Golden Rule

Never invent a new pattern if an existing one already exists.

Before writing code, always search the project and follow existing architecture, conventions, and style.

Every new piece of code should look as if it was originally written by the same developers who built LeadRat.
