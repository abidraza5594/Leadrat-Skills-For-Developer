import { createContext } from '../core/context.js';
import { logger } from '../core/logger.js';
import type { CommandOptions } from '../core/types.js';
import { TemplateInstaller } from '../templates/template-installer.js';
import { learnCommand } from './learn.js';
import { StateStore } from '../state/state-store.js';

export async function updateCommand(options: CommandOptions): Promise<void> {
  await learnCommand(options);

  const context = await createContext(options.root);
  const installer = new TemplateInstaller(context);
  const result = await installer.install({
    dryRun: options.dryRun,
    includeSeedDocs: false,
  });

  if (!options.dryRun && result.installed.length) {
    await new StateStore(context).recordInstalledFiles(result.installed);
  }

  logger.success('AI assistant files updated while preserving custom documentation sections');
}
