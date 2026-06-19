export class AssistantError extends Error {
  constructor(
    message: string,
    readonly code: string = 'ASSISTANT_ERROR',
    readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AssistantError';
  }
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
