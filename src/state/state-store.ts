import path from 'node:path';
import fs from 'fs-extra';
import { STATE_FILE_NAME, STATE_VERSION } from '../core/constants.js';
import type { AssistantContext, AssistantState, InstalledFileRecord } from '../core/types.js';

const EMPTY_STATE: AssistantState = {
  version: STATE_VERSION,
  installedFiles: [],
};

export class StateStore {
  constructor(private readonly context: AssistantContext) {}

  async read(): Promise<AssistantState> {
    const filePath = this.filePath();

    if (!(await fs.pathExists(filePath))) {
      return EMPTY_STATE;
    }

    const state = (await fs.readJson(filePath)) as Partial<AssistantState>;
    return {
      version: state.version ?? STATE_VERSION,
      sourceFingerprint: state.sourceFingerprint,
      installedFiles: state.installedFiles ?? [],
      lastLearnedAt: state.lastLearnedAt,
      lastInitializedAt: state.lastInitializedAt,
    };
  }

  async write(nextState: AssistantState): Promise<void> {
    await fs.ensureDir(this.context.stateRoot);
    await fs.writeJson(this.filePath(), nextState, { spaces: 2 });
  }

  async recordInstalledFiles(records: readonly InstalledFileRecord[]): Promise<void> {
    const current = await this.read();
    const byPath = new Map<string, InstalledFileRecord>();

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

  async recordLearn(sourceFingerprint: string, records: readonly InstalledFileRecord[]): Promise<void> {
    const current = await this.read();
    const byPath = new Map<string, InstalledFileRecord>();

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

  filePath(): string {
    return path.join(this.context.stateRoot, STATE_FILE_NAME);
  }
}
