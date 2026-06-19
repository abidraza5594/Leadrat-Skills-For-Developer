import { describe, expect, it } from 'vitest';
import { parseAzureWorkItemReference } from '../src/integrations/azure-devops-client.js';
import { parseFigmaReference } from '../src/integrations/figma-client.js';
import { createTaskBriefFileName, generateTaskBrief } from '../src/tasks/task-brief-generator.js';

describe('task integrations', () => {
  it('parses an Azure DevOps work item URL', () => {
    const reference = parseAzureWorkItemReference('https://dev.azure.com/leadrat/CRM/_workitems/edit/12345');

    expect(reference).toEqual({
      id: 12345,
      organization: 'leadrat',
      project: 'CRM',
      sourceUrl: 'https://dev.azure.com/leadrat/CRM/_workitems/edit/12345',
    });
  });

  it('parses a numeric Azure DevOps work item with fallback organization', () => {
    const reference = parseAzureWorkItemReference('12345', 'leadrat');

    expect(reference.id).toBe(12345);
    expect(reference.organization).toBe('leadrat');
  });

  it('uses LeadRat Azure DevOps defaults for numeric work items', () => {
    const reference = parseAzureWorkItemReference('16405');

    expect(reference.id).toBe(16405);
    expect(reference.organization).toBe('gharoffice');
    expect(reference.project).toBe('Leadrat-Black');
  });

  it('parses a Figma design URL with node ID', () => {
    const reference = parseFigmaReference('https://www.figma.com/design/AbCdEf/Page?node-id=10-20');

    expect(reference.fileKey).toBe('AbCdEf');
    expect(reference.nodeId).toBe('10:20');
  });

  it('generates a task brief without leaking credential placeholders', () => {
    const brief = generateTaskBrief({
      createdAt: '2026-06-19T00:00:00.000Z',
      azure: {
        id: 12345,
        sourceUrl: 'https://dev.azure.com/leadrat/CRM/_workitems/edit/12345',
        organization: 'leadrat',
        project: 'CRM',
        title: 'Add lead capture UI',
        tags: ['ui'],
        relations: [],
      },
    });

    expect(brief).toContain('Add lead capture UI');
    expect(brief).toContain('AGENTS.md');
    expect(brief).not.toContain('AZURE_DEVOPS_PAT=');
    expect(createTaskBriefFileName({ azure: {
      id: 12345,
      sourceUrl: '',
      organization: 'leadrat',
      title: 'x',
      tags: [],
      relations: [],
    } })).toBe('task-azure-12345.md');
  });
});
