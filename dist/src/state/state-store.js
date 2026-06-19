import path from 'node:path';
import fs from 'fs-extra';
import { STATE_FILE_NAME, STATE_VERSION } from '../core/constants.js';
const EMPTY_STATE = {
    version: STATE_VERSION,
    installedFiles: [],
};
export class StateStore {
    context;
    constructor(context) {
        this.context = context;
    }
    async read() {
        const filePath = this.filePath();
        if (!(await fs.pathExists(filePath))) {
            return EMPTY_STATE;
        }
        const state = (await fs.readJson(filePath));
        return {
            version: state.version ?? STATE_VERSION,
            sourceFingerprint: state.sourceFingerprint,
            installedFiles: state.installedFiles ?? [],
            lastLearnedAt: state.lastLearnedAt,
            lastInitializedAt: state.lastInitializedAt,
        };
    }
    async write(nextState) {
        await fs.ensureDir(this.context.stateRoot);
        await fs.writeJson(this.filePath(), nextState, { spaces: 2 });
    }
    async recordInstalledFiles(records) {
        const current = await this.read();
        const byPath = new Map();
        for (const record of current.installedFiles) {
            byPath.set(record.path, record);
        }
        for (const record of records) {
            byPath.set(record.path, record);
        }
        await this.write({
            ...current,
            installedFiles: [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path)),
            lastInitializedAt: new Date().toISOString(),
        });
    }
    async recordLearn(sourceFingerprint, records) {
        const current = await this.read();
        const byPath = new Map();
        for (const record of current.installedFiles) {
            byPath.set(record.path, record);
        }
        for (const record of records) {
            byPath.set(record.path, record);
        }
        await this.write({
            ...current,
            sourceFingerprint,
            installedFiles: [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path)),
            lastLearnedAt: new Date().toISOString(),
        });
    }
    filePath() {
        return path.join(this.context.stateRoot, STATE_FILE_NAME);
    }
}
//# sourceMappingURL=state-store.js.map