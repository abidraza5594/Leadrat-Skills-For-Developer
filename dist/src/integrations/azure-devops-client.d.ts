export interface AzureWorkItemReference {
    readonly id: number;
    readonly organization: string;
    readonly project?: string;
    readonly sourceUrl?: string;
}
export interface AzureWorkItemRelation {
    readonly rel?: string;
    readonly url?: string;
    readonly title?: string;
}
export interface AzureWorkItem {
    readonly id: number;
    readonly sourceUrl: string;
    readonly apiUrl?: string;
    readonly organization: string;
    readonly project?: string;
    readonly title: string;
    readonly workItemType?: string;
    readonly state?: string;
    readonly assignedTo?: string;
    readonly areaPath?: string;
    readonly iterationPath?: string;
    readonly tags: readonly string[];
    readonly createdDate?: string;
    readonly changedDate?: string;
    readonly description?: string;
    readonly acceptanceCriteria?: string;
    readonly relations: readonly AzureWorkItemRelation[];
}
export interface AzureWorkItemLookupOptions {
    readonly organization?: string;
    readonly project?: string;
}
export declare class AzureDevOpsClient {
    private readonly token;
    constructor(token?: string | undefined);
    getWorkItem(referenceText: string, options?: AzureWorkItemLookupOptions): Promise<AzureWorkItem>;
}
export declare function parseAzureWorkItemReference(input: string, fallbackOrganization?: string, fallbackProject?: string): AzureWorkItemReference;
