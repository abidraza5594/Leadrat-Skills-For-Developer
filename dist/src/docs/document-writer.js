import path from 'node:path';
import { readTextIfExists, toRelativePath, writeText } from '../files/file-ops.js';
import { mergeGeneratedDocument } from './document-merger.js';
export class DocumentWriter {
    context;
    constructor(context) {
        this.context = context;
    }
    async writeDocuments(documents, options = {}) {
        const records = [];
        for (const [fileName, content] of documents) {
            const targetPath = path.join(this.context.repoRoot, fileName);
            const existing = await readTextIfExists(targetPath);
            const merged = mergeGeneratedDocument(existing, content);
            if (!options.dryRun) {
                await writeText(targetPath, merged);
            }
            records.push({
                path: toRelativePath(this.context.repoRoot, targetPath),
                kind: 'doc',
                updatedAt: new Date().toISOString(),
            });
        }
        return records;
    }
}
//# sourceMappingURL=document-writer.js.map