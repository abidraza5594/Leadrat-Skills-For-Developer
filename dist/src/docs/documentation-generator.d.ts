import type { ScanResult } from '../scanner/models.js';
export declare class DocumentationGenerator {
    generate(scan: ScanResult, agentsSummary: string): ReadonlyMap<string, string>;
    private project;
    private architecture;
    private commonServices;
    private components;
    private apiGuidelines;
    private businessRules;
    private store;
    private models;
    private routes;
    private commonUtils;
    private errorHandling;
    private checklist;
}
