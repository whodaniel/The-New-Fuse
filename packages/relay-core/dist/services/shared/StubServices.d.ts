/**
 * Shared Stub Services for Relay Core
 * These will be replaced by real implementations from other packages as they mature.
 */
export declare class AgentHandoffTemplateService {
    generateHandoffTemplate(type: string, data: any): string;
    createHandoffPrompt(type: string, data: any): Promise<string>;
}
/**
 * Stub for future Blockchain event listener
 */
export declare class BlockchainEventMonitor {
    listen(): void;
}
//# sourceMappingURL=StubServices.d.ts.map