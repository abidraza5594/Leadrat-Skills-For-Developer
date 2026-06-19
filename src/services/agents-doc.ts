import fs from 'fs-extra';
import { AssistantError } from '../core/errors.js';
import type { AssistantContext } from '../core/types.js';

export async function ensureAgentsFile(context: AssistantContext): Promise<string> {
  if (!(await fs.pathExists(context.agentsPath))) {
    throw new AssistantError(
      'AGENTS.md is required in the Angular repository root or one of its parent folders. It must remain the highest-priority instruction document.',
      'AGENTS_MISSING'
    );
  }

  return fs.readFile(context.agentsPath, 'utf8');
}

export function summarizeAgents(content: string): string {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  const importantLines = normalized
    .split('\n')
    .filter((line) => /^#|^[-*] |^\d+\. |Never |Always |Use |Do not |Before /i.test(line.trim()))
    .slice(0, 60)
    .join('\n');

  return importantLines || normalized.slice(0, 1800);
}
