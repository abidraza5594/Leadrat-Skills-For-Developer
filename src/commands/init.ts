import inquirer from 'inquirer';
import { createContext } from '../core/context.js';
import { logger } from '../core/logger.js';
import type { CommandOptions } from '../core/types.js';
import { ensureAgentsFile } from '../services/agents-doc.js';
import { StateStore } from '../state/state-store.js';
import { TemplateInstaller } from '../templates/template-installer.js';

export async function initCommand(options: CommandOptions): Promise<void> {
  const context = await createContext(options.root);
  await ensureAgentsFile(context);

  const shouldProceed =
    options.yes ||
    (
      await inquirer.prompt<{ proceed: boolean }>([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Install LeadRat AI assistant configuration into this repository?',
          default: true,
        },
      ])
    ).proceed;

  if (!shouldProceed) {
    logger.warn('Init cancelled.');
    return;
  }

  const spinner = logger.spinner('Installing AI assistant configuration');
  const installer = new TemplateInstaller(context);
  const result = await installer.install({
    force: options.force,
    dryRun: options.dryRun,
  });

  if (!options.dryRun) {
    await new StateStore(context).recordInstalledFiles(result.installed);
  }

  spinner.succeed(options.dryRun ? 'Dry run completed' : 'AI assistant configuration installed');

  if (result.skipped.length) {
    logger.warn(`Skipped existing unmanaged files: ${result.skipped.join(', ')}`);
  }
}
