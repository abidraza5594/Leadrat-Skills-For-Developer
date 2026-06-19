import path from 'node:path';
import { createContext } from '../core/context.js';
import { AssistantError } from '../core/errors.js';
import { logger } from '../core/logger.js';
import { toRelativePath, writeText } from '../files/file-ops.js';
import { AzureDevOpsClient } from '../integrations/azure-devops-client.js';
import { FigmaClient } from '../integrations/figma-client.js';
import { ensureAgentsFile } from '../services/agents-doc.js';
import { createTaskBriefFileName, generateTaskBrief } from '../tasks/task-brief-generator.js';
export async function taskCommand(options) {
    const context = await createContext(options.root);
    if (!options.azure && !options.figma) {
        throw new AssistantError('task requires --azure, --figma, or both.', 'TASK_SOURCE_REQUIRED');
    }
    await ensureAgentsFile(context);
    const azure = options.azure ? await fetchAzureWorkItem(options) : undefined;
    const figma = options.figma ? await fetchFigmaContext(options.figma) : undefined;
    const content = generateTaskBrief({
        azure,
        figma,
        createdAt: new Date().toISOString(),
    });
    const outputPath = resolveOutputPath(context.repoRoot, options.out, createTaskBriefFileName({ azure, figma }));
    if (options.dryRun) {
        logger.info(content);
        logger.success(`Dry run generated task brief for ${toRelativePath(context.repoRoot, outputPath)}`);
        return;
    }
    await writeText(outputPath, content);
    logger.success(`Created AI task brief: ${toRelativePath(context.repoRoot, outputPath)}`);
    logger.info(`Next: ask your AI assistant to read ${toRelativePath(context.repoRoot, outputPath)} and implement it.`);
}
async function fetchAzureWorkItem(options) {
    const spinner = logger.spinner('Fetching Azure DevOps requirement');
    try {
        const workItem = await new AzureDevOpsClient().getWorkItem(options.azure ?? '', {
            organization: options.azureOrg,
            project: options.azureProject,
        });
        spinner.succeed(`Fetched Azure DevOps work item ${workItem.id}`);
        return workItem;
    }
    catch (error) {
        spinner.fail('Azure DevOps fetch failed');
        throw error;
    }
}
async function fetchFigmaContext(figmaReference) {
    const spinner = logger.spinner('Fetching Figma design context');
    try {
        const design = await new FigmaClient().getDesignContext(figmaReference);
        spinner.succeed(`Fetched Figma context for ${design.fileName ?? design.fileKey}`);
        return design;
    }
    catch (error) {
        spinner.fail('Figma fetch failed');
        throw error;
    }
}
function resolveOutputPath(repoRoot, output, defaultFileName) {
    if (output) {
        return path.isAbsolute(output) ? output : path.join(repoRoot, output);
    }
    return path.join(repoRoot, '.ai-dev-assistant', 'tasks', defaultFileName);
}
//# sourceMappingURL=task.js.map