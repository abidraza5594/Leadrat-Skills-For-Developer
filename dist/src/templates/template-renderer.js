import { DOCUMENTATION_FILES, MANAGED_MARKER, REQUIRED_LOAD_ORDER } from '../core/constants.js';
export function renderTemplate(content) {
    return content
        .replaceAll('{{MANAGED_MARKER}}', MANAGED_MARKER)
        .replaceAll('{{LOAD_ORDER}}', REQUIRED_LOAD_ORDER.map((file) => `1. ${file}`).join('\n'))
        .replaceAll('{{DOC_LIST}}', DOCUMENTATION_FILES.map((doc) => `- ${doc.fileName}`).join('\n'))
        .replaceAll('{{GENERATED_AT}}', new Date().toISOString());
}
//# sourceMappingURL=template-renderer.js.map