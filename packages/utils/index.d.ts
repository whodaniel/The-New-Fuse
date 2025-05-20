declare module '@the-new-fuse/utils' {
    export class Logger {
        constructor(context: string);
        info(message: string, ...args: unknown[]): void;
        error(message: string, ...args: unknown[]): void;
        warn(message: string, ...args: unknown[]): void;
        debug(message: string, ...args: unknown[]): void;
    }
}
