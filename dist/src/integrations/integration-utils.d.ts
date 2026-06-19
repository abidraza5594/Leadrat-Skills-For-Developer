export declare function isRecord(value: unknown): value is Record<string, unknown>;
export declare function getRecord(value: Record<string, unknown>, key: string): Record<string, unknown> | undefined;
export declare function getString(value: Record<string, unknown>, key: string): string | undefined;
export declare function getNumber(value: Record<string, unknown>, key: string): number | undefined;
export declare function getArray(value: Record<string, unknown>, key: string): readonly unknown[];
export declare function valueToText(value: unknown): string | undefined;
export declare function stripHtml(value: string): string;
export declare function truncateText(value: string | undefined, maxLength?: number): string;
export declare function sanitizeSlug(value: string): string;
