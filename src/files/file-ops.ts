import path from 'node:path';
import fs from 'fs-extra';
import { MANAGED_MARKER } from '../core/constants.js';

export async function readTextIfExists(filePath: string): Promise<string | undefined> {
  if (!(await fs.pathExists(filePath))) {
    return undefined;
  }

  return fs.readFile(filePath, 'utf8');
}

export async function writeText(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, ensureFinalNewline(content), 'utf8');
}

export function ensureFinalNewline(content: string): string {
  return content.endsWith('\n') ? content : `${content}\n`;
}

export function isManagedContent(content: string): boolean {
  return content.includes(MANAGED_MARKER);
}

export function toRelativePath(root: string, target: string): string {
  return path.relative(root, target).replace(/\\/g, '/');
}
