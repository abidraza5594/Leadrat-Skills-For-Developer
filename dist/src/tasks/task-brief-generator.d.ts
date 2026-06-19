import type { AzureWorkItem } from '../integrations/azure-devops-client.js';
import type { FigmaDesignContext } from '../integrations/figma-client.js';
export interface TaskBriefInput {
    readonly createdAt: string;
    readonly azure?: AzureWorkItem;
    readonly figma?: FigmaDesignContext;
}
export declare function generateTaskBrief(input: TaskBriefInput): string;
export declare function createTaskBriefFileName(input: Pick<TaskBriefInput, 'azure' | 'figma'>): string;
