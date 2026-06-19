import path from 'node:path';
import { createContext } from '../core/context.js';
import { DOCUMENTATION_FILES } from '../core/constants.js';
import { AssistantError } from '../core/errors.js';
import { logger } from '../core/logger.js';
import { DocumentWriter } from '../docs/document-writer.js';
import { StateStore } from '../state/state-store.js';
export async function syncCommand(options) {
    const context = await createContext(options.root);
    const repo = options.repo;
    if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
        throw new AssistantError('sync requires --repo owner/name.', 'SYNC_REPO_REQUIRED');
    }
    const ref = options.ref ?? 'main';
    const remotePath = (options.path ?? '.ai-dev-assistant/docs').replace(/^\/+|\/+$/g, '');
    const token = options.token ?? process.env.GITHUB_TOKEN;
    const documents = new Map();
    const spinner = logger.spinner(`Syncing documentation from ${repo}@${ref}`);
    for (const doc of DOCUMENTATION_FILES) {
        const url = `https://raw.githubusercontent.com/${repo}/${ref}/${remotePath}/${doc.fileName}`;
        const content = await fetchGithubText(url, token);
        documents.set(path.basename(doc.fileName), content);
    }
    const installed = await new DocumentWriter(context).writeDocuments(documents, {
        dryRun: options.dryRun,
    });
    if (!options.dryRun) {
        await new StateStore(context).recordInstalledFiles(installed);
    }
    spinner.succeed(options.dryRun ? 'Dry run sync completed' : 'Documentation synced');
}
async function fetchGithubText(url, token) {
    const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
        throw new AssistantError(`Failed to sync ${url}: ${response.status} ${response.statusText}`, 'SYNC_FETCH_FAILED');
    }
    return response.text();
}
//# sourceMappingURL=sync.js.map