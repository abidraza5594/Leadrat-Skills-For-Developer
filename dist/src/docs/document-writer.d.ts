import type { AssistantContext, InstalledFileRecord } from '../core/types.js';
export declare class DocumentWriter {
    private readonly context;
    constructor(context: AssistantContext);
    writeDocuments(documents: ReadonlyMap<string, string>, options?: {
        readonly dryRun?: boolean;
    }): Promise<readonly InstalledFileRecord[]>;
}
