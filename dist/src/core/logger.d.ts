import { type Ora } from 'ora';
export declare class Logger {
    info(message: string): void;
    success(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    spinner(message: string): Ora;
}
export declare const logger: Logger;
