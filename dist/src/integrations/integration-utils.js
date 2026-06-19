export function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function getRecord(value, key) {
    const nested = value[key];
    return isRecord(nested) ? nested : undefined;
}
export function getString(value, key) {
    const nested = value[key];
    return typeof nested === 'string' ? nested : undefined;
}
export function getNumber(value, key) {
    const nested = value[key];
    return typeof nested === 'number' && Number.isFinite(nested) ? nested : undefined;
}
export function getArray(value, key) {
    const nested = value[key];
    return Array.isArray(nested) ? nested : [];
}
export function valueToText(value) {
    if (typeof value === 'string') {
        return stripHtml(value);
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (isRecord(value)) {
        const displayName = getString(value, 'displayName');
        if (displayName) {
            return displayName;
        }
        const name = getString(value, 'name');
        if (name) {
            return name;
        }
    }
    return undefined;
}
export function stripHtml(value) {
    return value
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<li>/gi, '- ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
export function truncateText(value, maxLength = 6000) {
    if (!value) {
        return '';
    }
    if (value.length <= maxLength) {
        return value;
    }
    return `${value.slice(0, maxLength - 20).trimEnd()}\n\n[truncated]`;
}
export function sanitizeSlug(value) {
    const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || 'task';
}
//# sourceMappingURL=integration-utils.js.map