import { MasterClockSignalEnvelope, MasterClockSignalPlaintext, SignalAckRequest } from './types.js';
/**
 * Stable stringify for deterministic signing
 */
export declare function stableStringify(value: unknown): string;
/**
 * Security Service for Signal Trust Protocol
 */
export declare class SecurityService {
    /**
     * Verify and decrypt a Master Clock signal
     */
    static verifyAndDecryptSignal(signal: MasterClockSignalEnvelope, nodeEncryptionPrivateKeyPem: string): MasterClockSignalPlaintext;
    /**
     * Create a signed acknowledgement for a signal
     */
    static createNodeAckSignature(request: Omit<SignalAckRequest, 'signature_b64'>, nodeSigningPrivateKeyPem: string): string;
    /**
     * Helper to generate a new node key pair (for bootstrapping)
     */
    static generateNodeKeys(): {
        signing: {
            publicKey: string;
            privateKey: string;
        };
        encryption: {
            publicKey: string;
            privateKey: string;
        };
    };
}
//# sourceMappingURL=crypto.d.ts.map