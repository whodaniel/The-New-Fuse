export declare class LogsService {
    private logDir;
    constructor();
    tail(lines?: number, logType?: string): Promise<string[]>;
    errors(): Promise<string[]>;
    since(duration: string): Promise<string[]>;
    follow(callback: (line: string) => void, logType?: string): Promise<void>;
}
//# sourceMappingURL=LogsService.d.ts.map