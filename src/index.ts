export { AngularProjectScanner } from './scanner/angular-scanner.js';
export { DocumentationGenerator } from './docs/documentation-generator.js';
export { DocumentWriter } from './docs/document-writer.js';
export { TemplateInstaller } from './templates/template-installer.js';
export { AzureDevOpsClient, parseAzureWorkItemReference } from './integrations/azure-devops-client.js';
export { FigmaClient, parseFigmaReference } from './integrations/figma-client.js';
export { generateTaskBrief } from './tasks/task-brief-generator.js';
export type {
  KnowledgeDocumentGenerator,
  KnowledgeDocumentWriter,
  KnowledgeScanner,
  RemoteKnowledgeSource,
} from './core/ports.js';
