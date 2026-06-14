import { getRandomBytes, hmacSha256 } from '@the-new-fuse/security';
export class A2ASignatureWrapper {
    agentId;
    secret;
    constructor(agentId, secret) {
        this.agentId = agentId;
        this.secret = secret;
    }
    /**
     * Wraps an A2A message with a DACC-v1 compliant signature and optional resource pointers.
     */
    wrap(type, data, options) {
        const header = {
            agent_id: this.agentId,
            alg: 'HS256',
            nonce: this.generateNonce(),
            timestamp: Date.now(),
            resource_pointers: options?.resourcePointers,
        };
        const payload = {
            type,
            channel: options?.channel,
            data,
            conatus_weight: options?.conatusWeight,
        };
        const message = JSON.stringify({ header, payload });
        const signature = hmacSha256(message, this.secret);
        return { header, payload, signature };
    }
    generateNonce() {
        return getRandomBytes(16).toString('hex');
    }
}
