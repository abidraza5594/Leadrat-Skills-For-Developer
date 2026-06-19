#!/usr/bin/env node
import { Command } from 'commander';
import { cleanCommand } from './commands/clean.js';
import { doctorCommand } from './commands/doctor.js';
import { initCommand } from './commands/init.js';
import { learnCommand } from './commands/learn.js';
import { syncCommand } from './commands/sync.js';
import { taskCommand } from './commands/task.js';
import { updateCommand } from './commands/update.js';
import { toErrorMessage } from './core/errors.js';
import { logger } from './core/logger.js';

const program = new Command();

program
  .name('@leadrat/dev-assistant')
  .description('LeadRat AI Developer Assistant CLI')
  .version('0.1.0');

program
  .command('init')
  .description('Install AI assistant configuration into the current repository')
  .option('-r, --root <path>', 'repository root')
  .option('-y, --yes', 'skip confirmation prompts', false)
  .option('-f, --force', 'overwrite managed files and existing configs', false)
  .option('--dry-run', 'show what would be installed without writing files', false)
  .action(wrap(initCommand));

program
  .command('learn')
  .description('Scan the Angular project and generate AI knowledge documents')
  .option('-r, --root <path>', 'repository root')
  .option('--dry-run', 'scan and generate without writing files', false)
  .action(wrap(learnCommand));

program
  .command('doctor')
  .description('Validate AI assistant configuration and documentation freshness')
  .option('-r, --root <path>', 'repository root')
  .option('--json', 'print machine-readable findings', false)
  .option('--strict', 'exit non-zero when errors are found', false)
  .action(wrap(doctorCommand));

program
  .command('update')
  .description('Update generated documentation while preserving custom edits')
  .option('-r, --root <path>', 'repository root')
  .option('--dry-run', 'scan and update without writing files', false)
  .action(wrap(updateCommand));

program
  .command('sync')
  .description('Sync AI documentation from GitHub')
  .requiredOption('--repo <owner/name>', 'GitHub repository to sync from')
  .option('--ref <ref>', 'Git ref to sync from', 'main')
  .option('--path <path>', 'remote docs path', '.ai-dev-assistant/docs')
  .option('--token <token>', 'GitHub token; defaults to GITHUB_TOKEN')
  .option('-r, --root <path>', 'repository root')
  .option('--dry-run', 'fetch without writing files', false)
  .action(wrap(syncCommand));

program
  .command('task')
  .description('Create an AI implementation brief from Azure DevOps and Figma')
  .option('--azure <urlOrId>', 'Azure DevOps work item URL or numeric ID')
  .option('--figma <url>', 'Figma file, design, or prototype URL')
  .option('--azure-org <organization>', 'Azure DevOps organization; required when --azure is only a number')
  .option('--azure-project <project>', 'Azure DevOps project name for context')
  .option('--out <path>', 'output markdown path; defaults to .ai-dev-assistant/tasks/<task>.md')
  .option('-r, --root <path>', 'repository root')
  .option('--dry-run', 'fetch and render without writing a task file', false)
  .action(wrap(taskCommand));

program
  .command('clean')
  .description('Remove generated AI assistant files only; never removes AGENTS.md')
  .option('-r, --root <path>', 'repository root')
  .option('-y, --yes', 'skip confirmation prompts', false)
  .option('-f, --force', 'remove matching files even if the managed marker is missing', false)
  .option('--dry-run', 'show what would be removed without deleting files', false)
  .action(wrap(cleanCommand));

program.parseAsync(process.argv);

function wrap<TOptions>(handler: (options: TOptions) => Promise<void>) {
  return async (options: TOptions): Promise<void> => {
    try {
      await handler(options);
    } catch (error) {
      logger.error(toErrorMessage(error));
      process.exitCode = 1;
    }
  };
}
