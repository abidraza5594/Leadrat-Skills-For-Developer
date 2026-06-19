import { REQUIRED_LOAD_ORDER } from '../core/constants.js';
import { createManagedDocument } from './document-merger.js';
export class DocumentationGenerator {
    generate(scan, agentsSummary) {
        const documents = new Map();
        documents.set('PROJECT.md', createManagedDocument('Project', this.project(scan, agentsSummary)));
        documents.set('ARCHITECTURE.md', createManagedDocument('Architecture', this.architecture(scan)));
        documents.set('COMMON_SERVICES.md', createManagedDocument('Common Services', this.commonServices(scan)));
        documents.set('COMPONENTS.md', createManagedDocument('Components', this.components(scan)));
        documents.set('API_GUIDELINES.md', createManagedDocument('API Guidelines', this.apiGuidelines(scan)));
        documents.set('BUSINESS_RULES.md', createManagedDocument('Business Rules', this.businessRules()));
        documents.set('STORE.md', createManagedDocument('NgRx Store', this.store(scan)));
        documents.set('MODELS.md', createManagedDocument('Models', this.models(scan)));
        documents.set('ROUTES.md', createManagedDocument('Routes', this.routes(scan)));
        documents.set('COMMON_UTILS.md', createManagedDocument('Common Utilities', this.commonUtils(scan)));
        documents.set('ERROR_HANDLING.md', createManagedDocument('Error Handling', this.errorHandling(scan)));
        documents.set('CHECKLIST.md', createManagedDocument('Checklist', this.checklist(scan)));
        return documents;
    }
    project(scan, agentsSummary) {
        return [
            metadata(scan),
            '## Required AI Reading Order',
            orderedList([...REQUIRED_LOAD_ORDER]),
            '',
            '## Project Snapshot',
            table(['Area', 'Detected Count'], [
                ['Angular components', scan.components.length],
                ['Services and controllers', scan.services.length],
                ['API usages', scan.apiUsages.length],
                ['Routes', scan.routes.length],
                ['NgRx store slices', scan.store.length],
                ['Models, interfaces, enums, constants', scan.models.length],
                ['Shared utilities', scan.utilities.length],
                ['Pipes', scan.pipes.length],
                ['Directives', scan.directives.length],
                ['Guards', scan.guards.length],
                ['Interceptors', scan.interceptors.length],
            ]),
            '',
            '## Source Of Truth',
            'AGENTS.md is the highest-priority instruction document. When any generated document conflicts with AGENTS.md, AGENTS.md wins.',
            '',
            '## AGENTS.md Summary',
            blockquote(agentsSummary),
        ].join('\n');
    }
    architecture(scan) {
        return [
            metadata(scan),
            '## Angular Module Structure',
            bullets([
                'Lazy-routed feature modules live under `src/app/features`.',
                'NgRx domains live under `src/app/store`.',
                'Domain API wrappers live under `src/app/services/controllers`.',
                'Shared HTTP utilities live under `src/app/services/shared`.',
                'Cross-cutting guards, interceptors, interfaces, and helpers live under `src/app/core`.',
                'Reusable components, directives, and pipes live under `src/app/shared`.',
                'Global SCSS utilities and components live under `src/styles`.',
            ]),
            '',
            '## Detected NgModules',
            symbolTable(scan.modules, ['Name', 'Path']),
            '',
            '## Routing Modules',
            symbolTable(uniqueBy(scan.routes.map((route) => ({ name: route.filePath, filePath: route.filePath, exported: false }))), ['Routing File', 'Path']),
        ].join('\n');
    }
    commonServices(scan) {
        const sharedServices = scan.services.filter((service) => service.shared);
        const controllers = scan.services.filter((service) => service.controller);
        return [
            metadata(scan),
            '## Mandatory Reuse Rule',
            '`getModuleListByAdvFilter()` in `src/app/services/shared/common.service.ts` is the default approach for most GET APIs. Search for existing services and API wrappers before adding anything new.',
            '',
            '## Shared Services',
            serviceTable(sharedServices),
            '',
            '## Controller Services',
            serviceTable(controllers),
            '',
            '## Detected Common-Service API Usages',
            apiTable(scan.apiUsages.filter((usage) => usage.usesCommonService)),
        ].join('\n');
    }
    components(scan) {
        return [
            metadata(scan),
            '## Reuse Before Creating',
            'Search these existing components before creating new UI. Reuse existing CSS classes, `form-errors-wrapper`, and existing `ng-select` patterns.',
            '',
            '## Shared Components',
            componentTable(scan.components.filter((component) => component.shared)),
            '',
            '## Feature Components',
            componentTable(scan.components.filter((component) => !component.shared)),
            '',
            '## Pipes',
            symbolTable(scan.pipes, ['Pipe', 'Path']),
            '',
            '## Directives',
            symbolTable(scan.directives, ['Directive', 'Path']),
        ].join('\n');
    }
    apiGuidelines(scan) {
        return [
            metadata(scan),
            '## API Implementation Rules',
            bullets([
                'Search existing services, controllers, actions, effects, reducers, and common utilities before adding a new API.',
                'Use `getModuleListByAdvFilter()` for GET APIs whenever it can represent the request.',
                'Do not duplicate API methods or service methods.',
                'Keep API error handling consistent with the project notification/error handling patterns.',
                'Avoid hardcoded URLs; use existing constants, environment values, and service helpers.',
            ]),
            '',
            '## Detected API Calls',
            apiTable(scan.apiUsages),
        ].join('\n');
    }
    businessRules() {
        return [
            '## Mandatory Development Rules',
            bullets([
                'AGENTS.md is authoritative and must be loaded first.',
                'Understand nearby code and similar implementations before changing code.',
                'Never create duplicate services, APIs, helpers, components, directives, pipes, models, constants, or enums.',
                'Never use inline CSS.',
                'Preserve existing UI/UX unless a redesign is explicitly requested.',
                'Use existing confirmation popup patterns for destructive actions.',
                'Use existing date/time utilities and timezone helpers for any date or time work.',
                'Keep changes minimal and preserve user changes already present in the working tree.',
            ]),
        ].join('\n');
    }
    store(scan) {
        return [
            metadata(scan),
            '## NgRx Store Domains',
            storeTable(scan.store),
            '',
            '## Store Guidance',
            bullets([
                'Place domain state changes in the matching `src/app/store/<domain>` folder.',
                'Reuse existing actions, selectors, reducers, and effects before adding new ones.',
                'Avoid duplicate API calls in effects.',
                'Follow existing subscription cleanup patterns in components.',
            ]),
        ].join('\n');
    }
    models(scan) {
        return [
            metadata(scan),
            '## Interfaces, Types, Enums, And Constants',
            modelTable(scan.models),
            '',
            '## Strong Typing Rule',
            'Prefer existing interfaces, enums, constants, and shared models. Avoid `any` unless an external API shape makes it unavoidable.',
        ].join('\n');
    }
    routes(scan) {
        return [
            metadata(scan),
            '## Routes',
            routeTable(scan.routes),
            '',
            '## Guards',
            symbolTable(scan.guards, ['Guard', 'Path']),
            '',
            '## Interceptors',
            symbolTable(scan.interceptors, ['Interceptor', 'Path']),
        ].join('\n');
    }
    commonUtils(scan) {
        return [
            metadata(scan),
            '## Shared Utilities',
            utilityTable(scan.utilities),
            '',
            '## Date And Time',
            'Before implementing any date or time logic, search `src/app/core/utils/common.util.ts`, `src/app/app.constants.ts`, and shared helpers. Reuse timezone helpers such as `getTimeZoneDate`, `setTimeZoneDate`, `convertToUtc`, and `convertToLocalTime`.',
        ].join('\n');
    }
    errorHandling(scan) {
        const likelyNotificationServices = scan.services.filter((service) => /notification|error|alert|toast/i.test(service.name));
        return [
            metadata(scan),
            '## Error Handling Rules',
            bullets([
                'Handle API failures, empty responses, null values, undefined values, and invalid data.',
                'Use existing notification/error handling services and patterns.',
                'Never fail silently.',
                'Keep observable subscriptions leak-free with the project cleanup pattern.',
            ]),
            '',
            '## Likely Error/Notification Services',
            serviceTable(likelyNotificationServices),
        ].join('\n');
    }
    checklist(scan) {
        return [
            metadata(scan),
            '## Before Implementing',
            checklist([
                'Read AGENTS.md.',
                'Search for similar components, services, utilities, models, store code, and APIs.',
                'Confirm whether existing CSS and components can be reused.',
                'Confirm whether `getModuleListByAdvFilter()` supports any GET API requirement.',
            ]),
            '',
            '## Before Finishing',
            checklist([
                'Existing architecture and naming are followed.',
                'No duplicate services, APIs, utilities, or CSS were created.',
                'Editable fields use `form-errors-wrapper` and existing label classes.',
                'Dropdowns use `ng-select` and existing dropdown patterns.',
                'Date/time logic uses existing timezone helpers.',
                'Subscriptions are cleaned up.',
                'Build or focused tests were run when practical.',
            ]),
        ].join('\n');
    }
}
function metadata(scan) {
    return [
        `Generated from \`${scan.packageName}\` on ${scan.scannedAt}.`,
        scan.angularVersion ? `Detected Angular core version: \`${scan.angularVersion}\`.` : '',
        `Source fingerprint: \`${scan.sourceFingerprint}\`.`,
        '',
    ]
        .filter(Boolean)
        .join('\n');
}
function componentTable(components) {
    return table(['Component', 'Selector', 'Path', 'Inputs', 'Outputs'], limitRows(components).map((component) => [
        component.name,
        component.selector ?? '-',
        component.filePath,
        component.inputs.join(', ') || '-',
        component.outputs.join(', ') || '-',
    ]));
}
function serviceTable(services) {
    return table(['Service', 'Path', 'Methods', 'Dependencies'], limitRows(services).map((service) => [
        service.name,
        service.filePath,
        service.methods.slice(0, 8).join(', ') || '-',
        service.dependencies.slice(0, 5).join(', ') || '-',
    ]));
}
function apiTable(usages) {
    return table(['Owner', 'Method', 'Target', 'Common Service', 'Path'], limitRows(usages).map((usage) => [
        usage.owner,
        usage.verb ? `${usage.verb} ${usage.method}` : usage.method,
        usage.target ?? '-',
        usage.usesCommonService ? 'yes' : 'no',
        usage.filePath,
    ]));
}
function storeTable(store) {
    return table(['Domain', 'Directory', 'Actions', 'Reducers', 'Effects'], limitRows(store).map((slice) => [
        slice.name,
        slice.directory,
        String(slice.actions.length),
        String(slice.reducers.length),
        String(slice.effects.length),
    ]));
}
function modelTable(models) {
    return table(['Name', 'Kind', 'Path', 'Exported'], limitRows(models).map((model) => [model.name, model.kind, model.filePath, model.exported ? 'yes' : 'no']));
}
function routeTable(routes) {
    return table(['Route', 'Component', 'Load Children', 'Redirect', 'Guards', 'Path'], limitRows(routes).map((route) => [
        route.path,
        route.component ?? '-',
        route.loadChildren ?? '-',
        route.redirectTo ?? '-',
        route.guards.join(', ') || '-',
        route.filePath,
    ]));
}
function utilityTable(utilities) {
    return table(['Name', 'Kind', 'Path'], limitRows(utilities).map((utility) => [utility.name, utility.kind, utility.filePath]));
}
function symbolTable(symbols, headers) {
    return table(headers, limitRows(symbols).map((symbol) => [symbol.name, symbol.filePath]));
}
function table(headers, rows) {
    if (!rows.length) {
        return '_No entries detected._';
    }
    const header = `| ${headers.join(' | ')} |`;
    const separator = `| ${headers.map(() => '---').join(' | ')} |`;
    const body = rows.map((row) => `| ${row.map((cell) => sanitizeCell(String(cell))).join(' | ')} |`);
    return [header, separator, ...body].join('\n');
}
function bullets(items) {
    return items.map((item) => `- ${item}`).join('\n');
}
function checklist(items) {
    return items.map((item) => `- [ ] ${item}`).join('\n');
}
function orderedList(items) {
    return items.map((item, index) => `${index + 1}. \`${item}\``).join('\n');
}
function blockquote(content) {
    return content
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
}
function sanitizeCell(value) {
    return value.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}
function limitRows(items, limit = 250) {
    return items.slice(0, limit);
}
function uniqueBy(items) {
    const byPath = new Map();
    for (const item of items) {
        byPath.set(item.filePath, item);
    }
    return [...byPath.values()].sort((a, b) => a.filePath.localeCompare(b.filePath));
}
//# sourceMappingURL=documentation-generator.js.map