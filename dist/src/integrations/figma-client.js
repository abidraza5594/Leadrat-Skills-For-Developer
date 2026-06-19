import { AssistantError } from '../core/errors.js';
import { getArray, getNumber, getRecord, getString, isRecord, truncateText, } from './integration-utils.js';
export class FigmaClient {
    token;
    constructor(token = process.env.FIGMA_ACCESS_TOKEN) {
        this.token = token;
    }
    async getDesignContext(referenceText) {
        const reference = parseFigmaReference(referenceText);
        if (!this.token) {
            throw new AssistantError('Figma access token missing. Set FIGMA_ACCESS_TOKEN in your shell before running this command.', 'FIGMA_TOKEN_MISSING');
        }
        const url = createFigmaApiUrl(reference);
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
                'X-Figma-Token': this.token,
            },
        });
        if (!response.ok) {
            throw new AssistantError(`Failed to fetch Figma design context: ${response.status} ${response.statusText}`, 'FIGMA_FETCH_FAILED');
        }
        const payload = await response.json();
        if (!isRecord(payload)) {
            throw new AssistantError('Figma returned an invalid response.', 'FIGMA_INVALID_RESPONSE');
        }
        return toFigmaDesignContext(payload, reference);
    }
}
export function parseFigmaReference(input) {
    const trimmed = input.trim();
    if (!trimmed) {
        throw new AssistantError('Figma reference is empty.', 'FIGMA_REFERENCE_EMPTY');
    }
    let parsed;
    try {
        parsed = new URL(trimmed);
    }
    catch (error) {
        throw new AssistantError('Figma reference must be a valid file, design, or prototype URL.', 'FIGMA_REFERENCE_INVALID', error);
    }
    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith('figma.com')) {
        throw new AssistantError('Figma reference must be a figma.com URL.', 'FIGMA_REFERENCE_INVALID');
    }
    const segments = parsed.pathname.split('/').filter(Boolean);
    const fileSegmentIndex = segments.findIndex((segment) => ['file', 'design', 'proto'].includes(segment));
    const fileKey = fileSegmentIndex >= 0 ? segments[fileSegmentIndex + 1] : undefined;
    if (!fileKey) {
        throw new AssistantError('Could not find a Figma file key in the URL.', 'FIGMA_FILE_KEY_NOT_FOUND');
    }
    const nodeId = parsed.searchParams.get('node-id')?.replace(/-/g, ':') ?? undefined;
    return {
        fileKey,
        nodeId,
        sourceUrl: trimmed,
    };
}
function createFigmaApiUrl(reference) {
    if (reference.nodeId) {
        const url = new URL(`https://api.figma.com/v1/files/${reference.fileKey}/nodes`);
        url.searchParams.set('ids', reference.nodeId);
        return url;
    }
    return new URL(`https://api.figma.com/v1/files/${reference.fileKey}`);
}
function toFigmaDesignContext(payload, reference) {
    const nodes = reference.nodeId ? summarizeSelectedNodes(payload) : summarizeFile(payload);
    const selectedNode = nodes[0];
    return {
        sourceUrl: reference.sourceUrl,
        fileKey: reference.fileKey,
        nodeId: reference.nodeId,
        fileName: getString(payload, 'name'),
        lastModified: getString(payload, 'lastModified'),
        version: getString(payload, 'version'),
        thumbnailUrl: getString(payload, 'thumbnailUrl'),
        selectedNodeName: selectedNode?.name,
        selectedNodeType: selectedNode?.type,
        nodes,
        componentCount: Object.keys(getRecord(payload, 'components') ?? {}).length,
        styleCount: Object.keys(getRecord(payload, 'styles') ?? {}).length,
    };
}
function summarizeSelectedNodes(payload) {
    const nodesRecord = getRecord(payload, 'nodes') ?? {};
    const summaries = [];
    for (const [nodeId, nodePayload] of Object.entries(nodesRecord)) {
        if (!isRecord(nodePayload)) {
            continue;
        }
        const document = getRecord(nodePayload, 'document');
        if (document) {
            collectNodeSummaries(document, nodeId, 0, summaries, 80);
        }
    }
    return summaries;
}
function summarizeFile(payload) {
    const document = getRecord(payload, 'document');
    if (!document) {
        return [];
    }
    const summaries = [];
    collectNodeSummaries(document, 'document', 0, summaries, 120);
    return summaries;
}
function collectNodeSummaries(node, path, depth, summaries, limit) {
    if (summaries.length >= limit) {
        return;
    }
    const name = getString(node, 'name') ?? 'Unnamed';
    const type = getString(node, 'type') ?? 'UNKNOWN';
    const bounds = getRecord(node, 'absoluteBoundingBox');
    summaries.push({
        path,
        name,
        type,
        depth,
        text: truncateText(getString(node, 'characters'), 400) || undefined,
        width: bounds ? getNumber(bounds, 'width') : undefined,
        height: bounds ? getNumber(bounds, 'height') : undefined,
    });
    const children = getArray(node, 'children');
    for (const child of children) {
        if (summaries.length >= limit) {
            return;
        }
        if (isRecord(child)) {
            const childName = getString(child, 'name') ?? 'child';
            collectNodeSummaries(child, `${path}/${childName}`, depth + 1, summaries, limit);
        }
    }
}
//# sourceMappingURL=figma-client.js.map