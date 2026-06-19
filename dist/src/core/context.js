import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import { AssistantError } from './errors.js';
export async function createContext(root) {
    const repoRoot = await findRepoRoot(path.resolve(root ?? process.cwd()));
    const agentsPath = await findAgentsPath(repoRoot);
    const packageRoot = await findPackageRoot(path.dirname(fileURLToPath(import.meta.url)));
    return {
        repoRoot,
        packageRoot,
        templatesRoot: path.join(packageRoot, 'templates'),
        seedDocsRoot: path.join(packageRoot, 'docs'),
        stateRoot: path.join(repoRoot, '.ai-dev-assistant', 'state'),
        agentsPath,
    };
}
async function findPackageRoot(startPath) {
    let current = startPath;
    while (true) {
        const packageJsonPath = path.join(current, 'package.json');
        const templatesPath = path.join(current, 'templates');
        const docsPath = path.join(current, 'docs');
        if ((await fs.pathExists(packageJsonPath)) &&
            (await fs.pathExists(templatesPath)) &&
            (await fs.pathExists(docsPath))) {
            return current;
        }
        const parent = path.dirname(current);
        if (parent === current) {
            throw new AssistantError('Could not locate the LeadRat Dev Assistant package assets.', 'PACKAGE_ROOT_NOT_FOUND');
        }
        current = parent;
    }
}
async function findRepoRoot(startPath) {
    let current = startPath;
    while (true) {
        const packagePath = path.join(current, 'package.json');
        const angularPath = path.join(current, 'angular.json');
        if ((await fs.pathExists(packagePath)) && (await fs.pathExists(angularPath))) {
            return current;
        }
        const parent = path.dirname(current);
        if (parent === current) {
            throw new AssistantError('Could not find a LeadRat Angular repository. Run this command inside a repository that contains package.json and angular.json.', 'REPO_ROOT_NOT_FOUND');
        }
        current = parent;
    }
}
async function findAgentsPath(repoRoot) {
    let current = repoRoot;
    while (true) {
        const agentsPath = path.join(current, 'AGENTS.md');
        if (await fs.pathExists(agentsPath)) {
            return agentsPath;
        }
        const parent = path.dirname(current);
        if (parent === current) {
            return path.join(repoRoot, 'AGENTS.md');
        }
        current = parent;
    }
}
//# sourceMappingURL=context.js.map