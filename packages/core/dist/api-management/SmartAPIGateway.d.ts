export declare class SmartAPIGateway {
    private routes;
    constructor();
    registerRoute(path: string, handler: Function): void;
    handleRequest(path: string, data?: any): Promise<any>;
}
//# sourceMappingURL=SmartAPIGateway.d.ts.map