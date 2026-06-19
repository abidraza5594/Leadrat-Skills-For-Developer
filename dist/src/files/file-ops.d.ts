export declare function readTextIfExists(filePath: string): Promise<string | undefined>;
export declare function writeText(filePath: string, content: string): Promise<void>;
export declare function ensureFinalNewline(content: string): string;
export declare function isManagedContent(content: string): boolean;
export declare function toRelativePath(root: string, target: string): string;
