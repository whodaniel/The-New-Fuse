import { EventEmitter } from 'events';
/**
 * MessageRouter options
 */
export interface MessageRouterOptions {
    debug?: boolean;
}
/**
 * Basic Message Router for core communication package
 *
 * This is a simplified router for internal package use.
 * For full-featured routing, use the implementations in mcp-core or other packages.
 */
export declare class MessageRouter extends EventEmitter {
    private debug;
    constructor(options?: MessageRouterOptions);
    /**
     * Initialize the router
     */
    initialize(): Promise<void>;
    /**
     * Route a message (basic implementation)
     */
    routeMessage(message: any): Promise<void>;
}
//# sourceMappingURL=MessageRouter.d.ts.map