import path from 'node:path';
import fs from 'fs-extra';
import { MANAGED_MARKER } from '../core/constants.js';
export async function readTextIfExists(filePath) {
    if (!(await fs.pathExists(filePath))) {
        return undefined;
    }
    return fs.readFile(filePath, 'utf8');
}
export async function writeText(filePath, content) {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, ensureFinalNewline(content), 'utf8');
}
export function ensureFinalNewline(content) {
    return content.endsWith('\n') ? content : `${content}\n`;
}
export function isManagedContent(content) {
    return content.includes(MANAGED_MARKER);
}
export function toRelativePath(root, target) {
    return path.relative(root, target).replace(/\\/g, '/');
}
//# sourceMappingURL=file-ops.js.map