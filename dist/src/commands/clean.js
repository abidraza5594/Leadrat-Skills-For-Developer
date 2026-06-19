import path from 'node:path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { createContext } from '../core/context.js';
import { DOCUMENTATION_FILES, TEMPLATE_TARGETS } from '../core/constants.js';
import { logger } from '../core/logger.js';
import { isManagedContent, readTextIfExists } from '../files/file-ops.js';
import { StateStore } from '../state/state-store.js';
export async function cleanCommand(options) {
    const context = await createContext(options.root);
    const state = await new StateStore(context).read();
    const defaultTargets = [
        ...TEMPLATE_TARGETS.map((target) => target.target),
        ...DOCUMENTATION_FILES.map((doc) => doc.fileName),
    ];
    const targets = [...new Set([...defaultTargets, ...state.installedFiles.map((record) => record.path)])].filter((target) => target !== 'AGENTS.md');
    const shouldProceed = options.yes ||
        (await inquirer.prompt([
            {
                type: 'confirm',
                name: 'proceed',
                message: 'Remove generated LeadRat AI assistant files? AGENTS.md will not be removed.',
                default: false,
            },
        ])).proceed;
    if (!shouldProceed) {
        logger.warn('Clean cancelled.');
        return;
    }
    const removed = [];
    for (const target of targets) {
        const absolutePath = path.join(context.repoRoot, target);
        const content = await readTextIfExists(absolutePath);
        if (!content || (!options.force && !isManagedContent(content))) {
            continue;
        }
        if (!options.dryRun) {
            await fs.remove(absolutePath);
            await removeEmptyParents(context.repoRoot, path.dirname(absolutePath));
        }
        removed.push(target);
    }
    logger.success(options.dryRun ? `Dry run would remove ${removed.length} files` : `Removed ${removed.length} generated files`);
}
async function removeEmptyParents(root, startDir) {
    let current = startDir;
    while (current.startsWith(root) && current !== root) {
        const entries = await fs.readdir(current).catch(() => []);
        if (entries.length) {
            return;
        }
        await fs.rmdir(current);
        current = path.dirname(current);
    }
}
//# sourceMappingURL=clean.js.map