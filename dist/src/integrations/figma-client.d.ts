export interface FigmaReference {
    readonly fileKey: string;
    readonly nodeId?: string;
    readonly sourceUrl: string;
}
export interface FigmaNodeSummary {
    readonly path: string;
    readonly name: string;
    readonly type: string;
    readonly depth: number;
    readonly text?: string;
    readonly width?: number;
    readonly height?: number;
}
export interface FigmaDesignContext {
    readonly sourceUrl: string;
    readonly fileKey: string;
    readonly nodeId?: string;
    readonly fileName?: string;
    readonly lastModified?: string;
    readonly version?: string;
    readonly thumbnailUrl?: string;
    readonly selectedNodeName?: string;
    readonly selectedNodeType?: string;
    readonly nodes: readonly FigmaNodeSummary[];
    readonly componentCount: number;
    readonly styleCount: number;
}
export declare class FigmaClient {
    private readonly token;
    constructor(token?: string | undefined);
    getDesignContext(referenceText: string): Promise<FigmaDesignContext>;
}
export declare function parseFigmaReference(input: string): FigmaReference;
