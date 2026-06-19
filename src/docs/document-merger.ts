import {
  GENERATED_END,
  GENERATED_START,
  MANAGED_MARKER,
} from '../core/constants.js';

export function createManagedDocument(title: string, generatedBody: string): string {
  return [
    `<!-- ${MANAGED_MARKER} -->`,
    `# ${title}`,
    '',
    GENERATED_START,
    generatedBody.trim(),
    GENERATED_END,
    '',
    '## Custom Notes',
    '',
    'Human-maintained notes may be added here. The generated section above is replaced by `learn` and `update`; this section is preserved.',
    '',
  ].join('\n');
}

export function mergeGeneratedDocument(existing: string | undefined, nextDocument: string): string {
  if (!existing) {
    return nextDocument;
  }

  const nextBlock = extractGeneratedBlock(nextDocument);

  if (!nextBlock) {
    return nextDocument;
  }

  const existingStart = existing.indexOf(GENERATED_START);
  const existingEnd = existing.indexOf(GENERATED_END);

  if (existingStart >= 0 && existingEnd > existingStart) {
    const before = existing.slice(0, existingStart);
    const after = existing.slice(existingEnd + GENERATED_END.length);
    return `${before}${nextBlock}${after}`;
  }

  return `${existing.trimEnd()}\n\n${nextBlock}\n`;
}

function extractGeneratedBlock(document: string): string | undefined {
  const start = document.indexOf(GENERATED_START);
  const end = document.indexOf(GENERATED_END);

  if (start < 0 || end <= start) {
    return undefined;
  }

  return document.slice(start, end + GENERATED_END.length);
}
