export class AssistantError extends Error {
    code;
    cause;
    constructor(message, code = 'ASSISTANT_ERROR', cause) {
        super(message);
        this.code = code;
        this.cause = cause;
        this.name = 'AssistantError';
    }
}
export function toErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
//# sourceMappingURL=errors.js.map