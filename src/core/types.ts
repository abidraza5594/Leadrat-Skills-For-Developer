export interface AssistantContext {
  readonly repoRoot: string;
  readonly packageRoot: string;
  readonly templatesRoot: string;
  readonly seedDocsRoot: string;
  readonly stateRoot: string;
  readonly agentsPath: string;
}

export interface CommandOptions {
  readonly root?: string;
  readonly yes?: boolean;
  readonly force?: boolean;
  readonly dryRun?: boolean;
  readonly json?: boolean;
  readonly strict?: boolean;
}

export interface TemplateInstallTarget {
  readonly source: string;
  readonly target: string;
  readonly required: boolean;
}

export interface DocumentationFile {
  readonly fileName: string;
  readonly title: string;
}

export interface InstalledFileRecord {
  readonly path: string;
  readonly kind: 'config' | 'doc';
  readonly updatedAt: string;
}

export interface AssistantState {
  readonly version: number;
  readonly sourceFingerprint?: string;
  readonly installedFiles: readonly InstalledFileRecord[];
  readonly lastLearnedAt?: string;
  readonly lastInitializedAt?: string;
}

export interface DoctorFinding {
  readonly level: 'error' | 'warning' | 'info';
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export interface GithubSyncOptions extends CommandOptions {
  readonly repo?: string;
  readonly ref?: string;
  readonly path?: string;
  readonly token?: string;
}

export interface TaskCommandOptions extends CommandOptions {
  readonly azure?: string;
  readonly figma?: string;
  readonly azureOrg?: string;
  readonly azureProject?: string;
  readonly out?: string;
}
