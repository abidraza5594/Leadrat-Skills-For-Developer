import type { AssistantContext, InstalledFileRecord } from '../core/types.js';
export interface InstallResult {
    readonly installed: readonly InstalledFileRecord[];
    readonly skipped: readonly string[];
}
export declare class TemplateInstaller {
    private readonly context;
    constructor(context: AssistantContext);
    install(options?: {
        readonly force?: boolean;
        readonly dryRun?: boolean;
        readonly includeSeedDocs?: boolean;
    }): Promise<InstallResult>;
    installSeedDocs(options?: {
        readonly force?: boolean;
        readonly dryRun?: boolean;
    }): Promise<InstalledFileRecord[]>;
    private installTemplate;
}
