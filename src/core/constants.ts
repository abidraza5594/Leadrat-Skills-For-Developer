import type { DocumentationFile, TemplateInstallTarget } from './types.js';

export const ASSISTANT_NAME = 'LeadRat AI Developer Assistant';
export const STATE_VERSION = 1;
export const STATE_FILE_NAME = 'assistant-state.json';
export const MANAGED_MARKER = 'AI-DEV-ASSISTANT:MANAGED';
export const GENERATED_START = '<!-- AI-DEV-ASSISTANT:START GENERATED -->';
export const GENERATED_END = '<!-- AI-DEV-ASSISTANT:END GENERATED -->';

export const REQUIRED_LOAD_ORDER = [
  'AGENTS.md',
  'PROJECT.md',
  'ARCHITECTURE.md',
  'COMMON_SERVICES.md',
  'COMPONENTS.md',
  'API_GUIDELINES.md',
] as const;

export const DOCUMENTATION_FILES: readonly DocumentationFile[] = [
  { fileName: 'PROJECT.md', title: 'Project' },
  { fileName: 'ARCHITECTURE.md', title: 'Architecture' },
  { fileName: 'COMMON_SERVICES.md', title: 'Common Services' },
  { fileName: 'COMPONENTS.md', title: 'Components' },
  { fileName: 'API_GUIDELINES.md', title: 'API Guidelines' },
  { fileName: 'BUSINESS_RULES.md', title: 'Business Rules' },
  { fileName: 'STORE.md', title: 'NgRx Store' },
  { fileName: 'MODELS.md', title: 'Models' },
  { fileName: 'ROUTES.md', title: 'Routes' },
  { fileName: 'COMMON_UTILS.md', title: 'Common Utilities' },
  { fileName: 'ERROR_HANDLING.md', title: 'Error Handling' },
  { fileName: 'CHECKLIST.md', title: 'Checklist' },
];

export const TEMPLATE_TARGETS: readonly TemplateInstallTarget[] = [
  { source: 'CLAUDE.md', target: 'CLAUDE.md', required: true },
  { source: 'CURSOR.md', target: 'CURSOR.md', required: true },
  { source: 'GEMINI.md', target: 'GEMINI.md', required: true },
  {
    source: '.github/copilot-instructions.md',
    target: '.github/copilot-instructions.md',
    required: true,
  },
  {
    source: '.cursor/rules/leadrat-ai.mdc',
    target: '.cursor/rules/leadrat-ai.mdc',
    required: true,
  },
  { source: '.clinerules', target: '.clinerules', required: true },
  {
    source: 'continue.config.json',
    target: 'continue.config.json',
    required: true,
  },
  { source: 'roo.md', target: 'roo.md', required: true },
];

export const SOURCE_SCAN_GLOBS = [
  'src/app/**/*.ts',
  'src/styles/**/*.scss',
  'angular.json',
  'package.json',
  'tsconfig.json',
  'tsconfig.app.json',
] as const;

export const TS_SCAN_GLOBS = ['src/app/**/*.ts'] as const;

export const IGNORED_GLOBS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.angular/**',
  '**/.git/**',
  '**/*.spec.ts',
] as const;
