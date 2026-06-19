export declare class AssistantError extends Error {
    readonly code: string;
    readonly cause?: unknown | undefined;
    constructor(message: string, code?: string, cause?: unknown | undefined);
}
export declare function toErrorMessage(error: unknown): string;
