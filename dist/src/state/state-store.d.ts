import type { AssistantContext, AssistantState, InstalledFileRecord } from '../core/types.js';
export declare class StateStore {
    private readonly context;
    constructor(context: AssistantContext);
    read(): Promise<AssistantState>;
    write(nextState: AssistantState): Promise<void>;
    recordInstalledFiles(records: readonly InstalledFileRecord[]): Promise<void>;
    recordLearn(sourceFingerprint: string, records: readonly InstalledFileRecord[]): Promise<void>;
    filePath(): string;
}
