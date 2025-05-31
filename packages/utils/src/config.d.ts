export interface Config {
    redis: {
        host: string;
        port: number;
        password?: string;
        db?: number;
    };
    logger: {
        level: string;
        format: string;
    };
}
export declare function loadConfig(): Config;
//# sourceMappingURL=config.d.ts.map