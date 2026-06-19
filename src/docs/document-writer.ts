import path from 'node:path';
import type { AssistantContext, InstalledFileRecord } from '../core/types.js';
import { readTextIfExists, toRelativePath, writeText } from '../files/file-ops.js';
import { mergeGeneratedDocument } from './document-merger.js';

export class DocumentWriter {
  constructor(private readonly context: AssistantContext) {}

  async writeDocuments(
    documents: ReadonlyMap<string, string>,
    options: { readonly dryRun?: boolean } = {}
  ): Promise<readonly InstalledFileRecord[]> {
    const records: InstalledFileRecord[] = [];

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
