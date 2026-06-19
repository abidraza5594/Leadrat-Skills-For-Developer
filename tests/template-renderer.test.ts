import { describe, expect, it } from 'vitest';
import { MANAGED_MARKER } from '../src/core/constants.js';
import { renderTemplate } from '../src/templates/template-renderer.js';

describe('template renderer', () => {
  it('renders managed marker and load order tokens', () => {
    const rendered = renderTemplate('{{MANAGED_MARKER}}\n{{LOAD_ORDER}}');

    expect(rendered).toContain(MANAGED_MARKER);
    expect(rendered).toContain('AGENTS.md');
    expect(rendered).toContain('PROJECT.md');
  });
});
