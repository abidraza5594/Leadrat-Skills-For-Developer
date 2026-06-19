import type { ScanResult } from './models.js';
export declare class AngularProjectScanner {
    private readonly repoRoot;
    constructor(repoRoot: string);
    scan(): Promise<ScanResult>;
    computeFingerprint(): Promise<string>;
    private findTsFiles;
    private resolveTsConfig;
    private readPackageJson;
    private extractComponents;
    private extractServices;
    private extractApiUsages;
    private extractRoutes;
    private readRouteObject;
    private extractStore;
    private extractModels;
    private extractUtilities;
    private extractDecoratedSymbols;
    private extractGuardSymbols;
    private extractInterceptorSymbols;
    private relativePath;
}
