export interface KnowledgeScanner<TScanResult> {
  scan(): Promise<TScanResult>;
  computeFingerprint(): Promise<string>;
}

export interface KnowledgeDocumentGenerator<TScanResult> {
  generate(scanResult: TScanResult, instructionSummary: string): ReadonlyMap<string, string>;
}

export interface KnowledgeDocumentWriter {
  writeDocuments(
    documents: ReadonlyMap<string, string>,
    options?: { readonly dryRun?: boolean }
  ): Promise<readonly { readonly path: string; readonly kind: 'config' | 'doc'; readonly updatedAt: string }[]>;
}

export interface RemoteKnowledgeSource {
  readDocument(fileName: string): Promise<string>;
}
