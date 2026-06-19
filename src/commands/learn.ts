import { createContext } from '../core/context.js';
import { logger } from '../core/logger.js';
import type { CommandOptions } from '../core/types.js';
import { DocumentWriter } from '../docs/document-writer.js';
import { DocumentationGenerator } from '../docs/documentation-generator.js';
import { AngularProjectScanner } from '../scanner/angular-scanner.js';
import { ensureAgentsFile, summarizeAgents } from '../services/agents-doc.js';
import { StateStore } from '../state/state-store.js';

export async function learnCommand(options: CommandOptions): Promise<void> {
  const context = await createContext(options.root);
  const agentsContent = await ensureAgentsFile(context);
  const scanner = new AngularProjectScanner(context.repoRoot);

  const spinner = logger.spinner('Scanning Angular project');
  const scan = await scanner.scan();
  spinner.succeed('Angular project scanned');

  const documents = new DocumentationGenerator().generate(scan, summarizeAgents(agentsContent));
  const records = await new DocumentWriter(context).writeDocuments(documents, {
    dryRun: options.dryRun,
  });

  if (!options.dryRun) {
    await new StateStore(context).recordLearn(scan.sourceFingerprint, records);
  }

  logger.success(
    options.dryRun
      ? `Dry run generated ${documents.size} documentation files`
      : `Generated ${documents.size} documentation files`
  );
}
