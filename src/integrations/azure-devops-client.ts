import { Buffer } from 'node:buffer';
import { AssistantError } from '../core/errors.js';
import {
  getArray,
  getNumber,
  getRecord,
  getString,
  isRecord,
  truncateText,
  valueToText,
} from './integration-utils.js';

export const LEADRAT_AZURE_DEVOPS_DEFAULTS = {
  organization: 'gharoffice',
  project: 'Leadrat-Black',
  repository: 'Leadrat-Black-Web',
  pullRequestsUrl: 'https://dev.azure.com/gharoffice/Leadrat-Black/_git/Leadrat-Black-Web/pullrequests?_a=mine',
} as const;

export interface AzureWorkItemReference {
  readonly id: number;
  readonly organization: string;
  readonly project?: string;
  readonly sourceUrl?: string;
}

export interface AzureWorkItemRelation {
  readonly rel?: string;
  readonly url?: string;
  readonly title?: string;
}

export interface AzureWorkItem {
  readonly id: number;
  readonly sourceUrl: string;
  readonly apiUrl?: string;
  readonly organization: string;
  readonly project?: string;
  readonly title: string;
  readonly workItemType?: string;
  readonly state?: string;
  readonly assignedTo?: string;
  readonly areaPath?: string;
  readonly iterationPath?: string;
  readonly tags: readonly string[];
  readonly createdDate?: string;
  readonly changedDate?: string;
  readonly description?: string;
  readonly acceptanceCriteria?: string;
  readonly relations: readonly AzureWorkItemRelation[];
}

export interface AzureWorkItemLookupOptions {
  readonly organization?: string;
  readonly project?: string;
}

export class AzureDevOpsClient {
  constructor(private readonly token = process.env.AZURE_DEVOPS_PAT) {}

  async getWorkItem(referenceText: string, options: AzureWorkItemLookupOptions = {}): Promise<AzureWorkItem> {
    const reference = parseAzureWorkItemReference(
      referenceText,
      options.organization ?? process.env.AZURE_DEVOPS_ORG ?? LEADRAT_AZURE_DEVOPS_DEFAULTS.organization,
      options.project ?? process.env.AZURE_DEVOPS_PROJECT ?? LEADRAT_AZURE_DEVOPS_DEFAULTS.project
    );

    if (!this.token) {
      throw new AssistantError(
        'Azure DevOps token missing. Set AZURE_DEVOPS_PAT in your shell before running this command.',
        'AZURE_DEVOPS_TOKEN_MISSING'
      );
    }

    const url = new URL(`https://dev.azure.com/${encodeURIComponent(reference.organization)}/_apis/wit/workitems/${reference.id}`);
    url.searchParams.set('$expand', 'Relations');
    url.searchParams.set('api-version', '7.1');

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from(`:${this.token}`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      throw new AssistantError(
        `Failed to fetch Azure DevOps work item ${reference.id}: ${response.status} ${response.statusText}`,
        'AZURE_DEVOPS_FETCH_FAILED'
      );
    }

    const payload: unknown = await response.json();
    if (!isRecord(payload)) {
      throw new AssistantError('Azure DevOps returned an invalid work item response.', 'AZURE_DEVOPS_INVALID_RESPONSE');
    }

    return toAzureWorkItem(payload, reference);
  }
}

export function parseAzureWorkItemReference(
  input: string,
  fallbackOrganization: string = LEADRAT_AZURE_DEVOPS_DEFAULTS.organization,
  fallbackProject: string = LEADRAT_AZURE_DEVOPS_DEFAULTS.project
): AzureWorkItemReference {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new AssistantError('Azure DevOps work item reference is empty.', 'AZURE_DEVOPS_REFERENCE_EMPTY');
  }

  if (/^\d+$/.test(trimmed)) {
    const organization = fallbackOrganization?.trim();
    if (!organization) {
      throw new AssistantError('Azure DevOps organization is required when using only a work item number.', 'AZURE_DEVOPS_ORG_REQUIRED');
    }

    return {
      id: Number(trimmed),
      organization,
      project: fallbackProject?.trim() || undefined,
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch (error) {
    throw new AssistantError('Azure DevOps reference must be a work item URL or numeric ID.', 'AZURE_DEVOPS_REFERENCE_INVALID', error);
  }

  const id = extractWorkItemId(parsed);
  const { organization, project } = extractOrganization(parsed, fallbackOrganization, fallbackProject);

  if (!id) {
    throw new AssistantError('Could not find a work item ID in the Azure DevOps URL.', 'AZURE_DEVOPS_ID_NOT_FOUND');
  }

  if (!organization) {
    throw new AssistantError('Could not find Azure DevOps organization. Pass --azure-org or set AZURE_DEVOPS_ORG.', 'AZURE_DEVOPS_ORG_REQUIRED');
  }

  return {
    id,
    organization,
    project,
    sourceUrl: trimmed,
  };
}

function extractWorkItemId(url: URL): number | undefined {
  const editMatch = url.pathname.match(/\/_workitems\/edit\/(\d+)/i);
  if (editMatch) {
    return Number(editMatch[1]);
  }

  const queryCandidates = ['workitem', 'workItem', 'id'];
  for (const key of queryCandidates) {
    const value = url.searchParams.get(key);
    if (value && /^\d+$/.test(value)) {
      return Number(value);
    }
  }

  const lastNumber = url.pathname.match(/(\d+)(?:\/)?$/);
  return lastNumber ? Number(lastNumber[1]) : undefined;
}

function extractOrganization(
  url: URL,
  fallbackOrganization?: string,
  fallbackProject?: string
): { readonly organization?: string; readonly project?: string } {
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment));

  if (host === 'dev.azure.com') {
    const organization = segments[0] ?? fallbackOrganization?.trim();
    const project = segments[1] && !segments[1].startsWith('_') ? segments[1] : fallbackProject?.trim();
    return { organization, project };
  }

  if (host.endsWith('.visualstudio.com')) {
    const organization = host.replace(/\.visualstudio\.com$/i, '');
    const project = segments[0] && !segments[0].startsWith('_') ? segments[0] : fallbackProject?.trim();
    return { organization, project };
  }

  return {
    organization: fallbackOrganization?.trim(),
    project: fallbackProject?.trim(),
  };
}

function toAzureWorkItem(payload: Record<string, unknown>, reference: AzureWorkItemReference): AzureWorkItem {
  const fields = getRecord(payload, 'fields') ?? {};
  const id = getNumber(payload, 'id') ?? reference.id;
  const title = fieldText(fields, 'System.Title') || `Work item ${id}`;
  const tags = parseTags(fieldText(fields, 'System.Tags'));

  return {
    id,
    sourceUrl: reference.sourceUrl ?? `https://dev.azure.com/${reference.organization}/_workitems/edit/${id}`,
    apiUrl: getString(payload, 'url'),
    organization: reference.organization,
    project: reference.project,
    title,
    workItemType: fieldText(fields, 'System.WorkItemType'),
    state: fieldText(fields, 'System.State'),
    assignedTo: fieldText(fields, 'System.AssignedTo'),
    areaPath: fieldText(fields, 'System.AreaPath'),
    iterationPath: fieldText(fields, 'System.IterationPath'),
    tags,
    createdDate: fieldText(fields, 'System.CreatedDate'),
    changedDate: fieldText(fields, 'System.ChangedDate'),
    description: truncateText(fieldText(fields, 'System.Description')),
    acceptanceCriteria: truncateText(fieldText(fields, 'Microsoft.VSTS.Common.AcceptanceCriteria')),
    relations: parseRelations(getArray(payload, 'relations')),
  };
}

function fieldText(fields: Record<string, unknown>, fieldName: string): string | undefined {
  return valueToText(fields[fieldName]);
}

function parseTags(tags: string | undefined): readonly string[] {
  if (!tags) {
    return [];
  }

  return tags
    .split(';')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseRelations(relations: readonly unknown[]): readonly AzureWorkItemRelation[] {
  return relations.filter(isRecord).map((relation) => {
    const attributes = getRecord(relation, 'attributes') ?? {};

    return {
      rel: getString(relation, 'rel'),
      url: getString(relation, 'url'),
      title: getString(attributes, 'name') ?? getString(attributes, 'comment'),
    };
  });
}
