import path from 'node:path';
import fs from 'fs-extra';
import { createContext } from '../core/context.js';
import { DOCUMENTATION_FILES, TEMPLATE_TARGETS, } from '../core/constants.js';
import { logger } from '../core/logger.js';
import { AngularProjectScanner } from '../scanner/angular-scanner.js';
import { StateStore } from '../state/state-store.js';
export async function doctorCommand(options) {
    const context = await createContext(options.root);
    const findings = [];
    await checkRequiredFile(context.agentsPath, findings, 'AGENTS_MISSING', 'AGENTS.md is missing.');
    for (const target of TEMPLATE_TARGETS) {
        await checkRequiredFile(path.join(context.repoRoot, target.target), findings, 'CONFIG_MISSING', `Missing AI assistant config: ${target.target}`, target.target);
    }
    for (const doc of DOCUMENTATION_FILES) {
        await checkRequiredFile(path.join(context.repoRoot, doc.fileName), findings, 'DOC_MISSING', `Missing AI knowledge document: ${doc.fileName}`, doc.fileName);
    }
    await checkAssistantStructure(context.repoRoot, findings);
    await checkOutdatedDocs(context.repoRoot, findings);
    if (options.json) {
        console.log(JSON.stringify({ ok: !findings.some((finding) => finding.level === 'error'), findings }, null, 2));
    }
    else {
        renderFindings(findings);
    }
    if (options.strict && findings.some((finding) => finding.level === 'error')) {
        process.exitCode = 1;
    }
}
async function checkRequiredFile(filePath, findings, code, message, displayPath) {
    if (!(await fs.pathExists(filePath))) {
        findings.push({ level: 'error', code, message, path: displayPath ?? filePath });
    }
}
async function checkAssistantStructure(repoRoot, findings) {
    const assistantRoot = path.join(repoRoot, '.ai-dev-assistant');
    const requiredDirs = ['bin', 'src', 'templates', 'commands', 'docs', 'tests', 'examples'];
    if (!(await fs.pathExists(assistantRoot))) {
        findings.push({
            level: 'warning',
            code: 'ASSISTANT_FOLDER_MISSING',
            message: '.ai-dev-assistant folder is not present in this repository.',
            path: '.ai-dev-assistant',
        });
        return;
    }
    for (const dirName of requiredDirs) {
        const dirPath = path.join(assistantRoot, dirName);
        if (!(await fs.pathExists(dirPath))) {
            findings.push({
                level: 'error',
                code: 'ASSISTANT_STRUCTURE_INVALID',
                message: `Missing .ai-dev-assistant/${dirName} directory.`,
                path: `.ai-dev-assistant/${dirName}`,
            });
        }
    }
}
async function checkOutdatedDocs(repoRoot, findings) {
    const context = await createContext(repoRoot);
    const state = await new StateStore(context).read();
    if (!state.sourceFingerprint) {
        findings.push({
            level: 'warning',
            code: 'LEARN_NOT_RUN',
            message: 'Documentation has not been generated with learn yet.',
        });
        return;
    }
    const currentFingerprint = await new AngularProjectScanner(repoRoot).computeFingerprint();
    if (currentFingerprint !== state.sourceFingerprint) {
        findings.push({
            level: 'warning',
            code: 'DOCS_OUTDATED',
            message: 'Source files changed after the last learn run. Run update.',
        });
    }
}
function renderFindings(findings) {
    if (!findings.length) {
        logger.success('Doctor passed. AI assistant configuration is healthy.');
        return;
    }
    for (const finding of findings) {
        const suffix = finding.path ? ` (${finding.path})` : '';
        const message = `${finding.code}: ${finding.message}${suffix}`;
        if (finding.level === 'error') {
            logger.error(message);
        }
        else if (finding.level === 'warning') {
            logger.warn(message);
        }
        else {
            logger.info(message);
        }
    }
}
//# sourceMappingURL=doctor.js.map