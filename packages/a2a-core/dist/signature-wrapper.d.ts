/**
 * TNF Resource Pointer (TRP)
 * Represents a reference to external data stored in the Federated Knowledge Graph
 * or another persistent store (e.g. pgvector, S3, R2, local filesystem).
 */
export interface TNFResourcePointer {
    uri: string;
    integrityHash?: string;
    mimeType?: string;
    size?: number;
}
/**
 * A2A Signed Packet (DACC-v1 Compliant)
 *
 * Evolution: Now supports resource_pointers to prevent "All-in-Memory" OOM crashes.
 * Payload should contain lightweight metadata, while heavy data is passed via pointers.
 */
export interface A2ASignedPacket {
    header: {
        agent_id: string;
        alg: 'HS256';
        nonce: string;
        timestamp: number;
        resource_pointers?: Record<string, TNFResourcePointer>;
    };
    payload: {
        type: string;
        channel?: string;
        data: unknown;
        conatus_weight?: number;
    };
    signature: string;
}
export declare class A2ASignatureWrapper {
    private readonly agentId;
    private readonly secret;
    constructor(agentId: string, secret: string);
    /**
     * Wraps an A2A message with a DACC-v1 compliant signature and optional resource pointers.
     */
    wrap(type: string, data: unknown, options?: {
        channel?: string;
        conatusWeight?: number;
        resourcePointers?: Record<string, TNFResourcePointer>;
    }): A2ASignedPacket;
    private generateNonce;
}
