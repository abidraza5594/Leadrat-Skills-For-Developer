import { describe, expect, it } from 'vitest';
import { GENERATED_END, GENERATED_START } from '../src/core/constants.js';
import { createManagedDocument, mergeGeneratedDocument } from '../src/docs/document-merger.js';

describe('document merger', () => {
  it('replaces only the generated section', () => {
    const existing = [
      '# Project',
      '',
      GENERATED_START,
      'old generated',
      GENERATED_END,
      '',
      '## Custom Notes',
      'keep me',
    ].join('\n');
    const next = createManagedDocument('Project', 'new generated');

    const merged = mergeGeneratedDocument(existing, next);

    expect(merged).toContain('new generated');
    expect(merged).not.toContain('old generated');
    expect(merged).toContain('keep me');
  });
});
