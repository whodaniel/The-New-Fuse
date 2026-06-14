export declare class CorrelationIdService {
    private static asyncLocalStorage;
    static generateCorrelationId(): string;
    static getCorrelationId(): string | undefined;
    static runWithId<T>(correlationId: string, fn: () => T): T;
    static middleware(req: any, res: any, next: any): void;
}
//# sourceMappingURL=correlation-id.d.ts.map