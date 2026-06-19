import path from 'node:path';
import fs from 'fs-extra';
import { DOCUMENTATION_FILES, MANAGED_MARKER, TEMPLATE_TARGETS } from '../core/constants.js';
import type { AssistantContext, InstalledFileRecord, TemplateInstallTarget } from '../core/types.js';
import { isManagedContent, readTextIfExists, toRelativePath, writeText } from '../files/file-ops.js';
import { mergeGeneratedDocument } from '../docs/document-merger.js';
import { renderTemplate } from './template-renderer.js';

export interface InstallResult {
  readonly installed: readonly InstalledFileRecord[];
  readonly skipped: readonly string[];
}

export class TemplateInstaller {
  constructor(private readonly context: AssistantContext) {}

  async install(
    options: {
      readonly force?: boolean;
      readonly dryRun?: boolean;
      readonly includeSeedDocs?: boolean;
    } = {}
  ): Promise<InstallResult> {
    const installed: InstalledFileRecord[] = [];
    const skipped: string[] = [];

    for (const target of TEMPLATE_TARGETS) {
      const record = await this.installTemplate(target, options);

      if (record) {
        installed.push(record);
      } else {
        skipped.push(target.target);
      }
    }

    if (options.includeSeedDocs ?? true) {
      const docRecords = await this.installSeedDocs(options);
      installed.push(...docRecords);
    }

    return { installed, skipped };
  }

  async installSeedDocs(options: { readonly force?: boolean; readonly dryRun?: boolean } = {}): Promise<InstalledFileRecord[]> {
    const records: InstalledFileRecord[] = [];

    for (const doc of DOCUMENTATION_FILES) {
      const sourcePath = path.join(this.context.seedDocsRoot, doc.fileName);
      const targetPath = path.join(this.context.repoRoot, doc.fileName);

      if (!(await fs.pathExists(sourcePath))) {
        continue;
      }

      const seed = await fs.readFile(sourcePath, 'utf8');
      const existing = await readTextIfExists(targetPath);

      if (existing && !options.force && !isManagedContent(existing)) {
        continue;
      }

      const nextContent = mergeGeneratedDocument(existing, renderTemplate(seed));

      if (!options.dryRun) {
        await writeText(targetPath, nextContent);
      }

      records.push({
        path: toRelativePath(this.context.repoRoot, targetPath),
        kind: 'doc',
        updatedAt: new Date().toISOString(),
      });
    }

    return records;
  }

  private async installTemplate(
    target: TemplateInstallTarget,
    options: { readonly force?: boolean; readonly dryRun?: boolean }
  ): Promise<InstalledFileRecord | undefined> {
    const sourcePath = path.join(this.context.templatesRoot, target.source);
    const targetPath = path.join(this.context.repoRoot, target.target);
    const existing = await readTextIfExists(targetPath);

    if (!(await fs.pathExists(sourcePath))) {
      return undefined;
    }

    if (existing && !options.force && !isManagedContent(existing)) {
      return undefined;
    }

    const templateContent = renderTemplate(await fs.readFile(sourcePath, 'utf8'));

    if (!options.dryRun) {
      await writeText(targetPath, templateContent);
    }

    return {
      path: toRelativePath(this.context.repoRoot, targetPath),
      kind: 'config',
      updatedAt: new Date().toISOString(),
    };
  }
}
