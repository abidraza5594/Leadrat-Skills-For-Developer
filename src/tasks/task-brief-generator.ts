import type { AzureWorkItem } from '../integrations/azure-devops-client.js';
import type { FigmaDesignContext, FigmaNodeSummary } from '../integrations/figma-client.js';
import { sanitizeSlug, truncateText } from '../integrations/integration-utils.js';

const TASK_CONTEXT_MARKER = 'AI-DEV-ASSISTANT:TASK-CONTEXT';

export interface TaskBriefInput {
  readonly createdAt: string;
  readonly azure?: AzureWorkItem;
  readonly figma?: FigmaDesignContext;
}

export function generateTaskBrief(input: TaskBriefInput): string {
  const sections = [
    `<!-- ${TASK_CONTEXT_MARKER} -->`,
    '# LeadRat AI Task Context',
    '',
    `Generated at: ${input.createdAt}`,
    '',
    '## How AI Must Use This File',
    '',
    'Before implementing anything, load and follow:',
    '',
    '1. `AGENTS.md`',
    '2. `PROJECT.md`',
    '3. `ARCHITECTURE.md`',
    '4. `COMMON_SERVICES.md`',
    '5. `COMPONENTS.md`',
    '6. `API_GUIDELINES.md`',
    '',
    '`AGENTS.md` wins if any generated context conflicts with it.',
    '',
    'Implementation behavior:',
    '',
    '- Understand the requirement below before editing code.',
    '- Search the LeadRat codebase for similar screens, services, APIs, components, CSS classes, and utilities.',
    '- Reuse existing Angular, NgRx, API, form, modal, table, dropdown, and validation patterns.',
    '- Never use inline CSS.',
    '- Use existing CSS utilities and shared components.',
    '- Use `ng-select` for dropdown/selectable fields.',
    '- Use `form-errors-wrapper` for editable form validation.',
    '- Reuse `getModuleListByAdvFilter()` for compatible GET APIs.',
    '- Keep edits minimal, typed, and production-ready.',
    '',
    input.azure ? renderAzureSection(input.azure) : '## Azure DevOps Requirement\n\nNo Azure DevOps work item was provided.\n',
    input.figma ? renderFigmaSection(input.figma) : '## Figma Design Context\n\nNo Figma design link was provided.\n',
    renderImplementationPrompt(input),
  ];

  return `${sections.join('\n')}\n`;
}

export function createTaskBriefFileName(input: Pick<TaskBriefInput, 'azure' | 'figma'>): string {
  const parts = ['task'];

  if (input.azure) {
    parts.push(`azure-${input.azure.id}`);
  }

  if (input.figma) {
    parts.push(`figma-${input.figma.fileKey}`);
    if (input.figma.nodeId) {
      parts.push(input.figma.nodeId);
    }
  }

  return `${sanitizeSlug(parts.join('-'))}.md`;
}

function renderAzureSection(workItem: AzureWorkItem): string {
  return [
    '## Azure DevOps Requirement',
    '',
    `- Work Item: [${workItem.id}](${workItem.sourceUrl})`,
    `- Title: ${workItem.title}`,
    `- Type: ${workItem.workItemType ?? 'Not provided'}`,
    `- State: ${workItem.state ?? 'Not provided'}`,
    `- Assigned To: ${workItem.assignedTo ?? 'Not provided'}`,
    `- Area Path: ${workItem.areaPath ?? 'Not provided'}`,
    `- Iteration Path: ${workItem.iterationPath ?? 'Not provided'}`,
    `- Tags: ${workItem.tags.length ? workItem.tags.join(', ') : 'Not provided'}`,
    `- Created: ${workItem.createdDate ?? 'Not provided'}`,
    `- Changed: ${workItem.changedDate ?? 'Not provided'}`,
    '',
    '### Description',
    '',
    blockOrFallback(workItem.description, 'No description provided.'),
    '',
    '### Acceptance Criteria',
    '',
    blockOrFallback(workItem.acceptanceCriteria, 'No acceptance criteria provided.'),
    '',
    '### Relations',
    '',
    workItem.relations.length ? renderRelations(workItem.relations) : 'No related work items or links returned.',
    '',
  ].join('\n');
}

function renderFigmaSection(figma: FigmaDesignContext): string {
  return [
    '## Figma Design Context',
    '',
    `- File: ${figma.fileName ?? 'Not provided'}`,
    `- Source: ${figma.sourceUrl}`,
    `- File Key: ${figma.fileKey}`,
    `- Node ID: ${figma.nodeId ?? 'Whole file'}`,
    `- Selected Node: ${figma.selectedNodeName ?? 'Not provided'}${figma.selectedNodeType ? ` (${figma.selectedNodeType})` : ''}`,
    `- Last Modified: ${figma.lastModified ?? 'Not provided'}`,
    `- Version: ${figma.version ?? 'Not provided'}`,
    `- Components: ${figma.componentCount}`,
    `- Styles: ${figma.styleCount}`,
    figma.thumbnailUrl ? `- Thumbnail: ${figma.thumbnailUrl}` : '- Thumbnail: Not provided',
    '',
    '### Node Summary',
    '',
    figma.nodes.length ? renderFigmaNodes(figma.nodes) : 'No Figma nodes were returned.',
    '',
  ].join('\n');
}

function renderImplementationPrompt(input: TaskBriefInput): string {
  const requirement = input.azure
    ? `Implement Azure DevOps work item ${input.azure.id}: ${input.azure.title}.`
    : 'Implement the requested change from the available design context.';

  const figmaInstruction = input.figma
    ? 'Use the Figma context as the visual reference, but match LeadRat existing UI classes, spacing, components, and design conventions.'
    : 'No Figma context was provided; preserve existing LeadRat UI conventions.';

  return [
    '## AI Implementation Prompt',
    '',
    requirement,
    '',
    figmaInstruction,
    '',
    'Expected workflow:',
    '',
    '1. Read the required docs listed at the top of this file.',
    '2. Search existing LeadRat implementations before adding anything new.',
    '3. Identify the smallest set of files needed for the requirement.',
    '4. Implement the change using existing patterns.',
    '5. Run the relevant build/test command from `package.json` when practical.',
    '6. Report changed files, verification, and any blocker.',
    '',
  ].join('\n');
}

function blockOrFallback(value: string | undefined, fallback: string): string {
  const text = truncateText(value, 8000);
  return text ? text : fallback;
}

function renderRelations(relations: AzureWorkItem['relations']): string {
  return relations
    .map((relation) => {
      const label = relation.title ?? relation.rel ?? 'Relation';
      return `- ${label}${relation.url ? `: ${relation.url}` : ''}`;
    })
    .join('\n');
}

function renderFigmaNodes(nodes: readonly FigmaNodeSummary[]): string {
  const rows = [
    '| Depth | Type | Name | Size | Text |',
    '| --- | --- | --- | --- | --- |',
    ...nodes.map((node) => {
      const size = node.width && node.height ? `${Math.round(node.width)}x${Math.round(node.height)}` : '';
      const text = node.text ? sanitizeTableCell(node.text) : '';
      return `| ${node.depth} | ${sanitizeTableCell(node.type)} | ${sanitizeTableCell(node.name)} | ${size} | ${text} |`;
    }),
  ];

  return rows.join('\n');
}

function sanitizeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}
