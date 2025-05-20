import { EventEmitter } from 'events';

export interface ProtocolDefinition {
    id: string;
    version: string;
    handlers: Map<string, MessageHandler>;
    validators: Map<string, MessageValidator>;
    compatibleVersions?: VersionRange;
    deprecated?: boolean;
}

export interface VersionRange {
    min: string;
    max: string;
}

export interface MessageHandler {
    (message: unknown): Promise<unknown>;
}

export interface MessageValidator {
    (message: unknown): boolean;
}

export class ProtocolRegistry extends EventEmitter {
    private protocols: Map<string, ProtocolDefinition> = new Map();
    private activeProtocols: Set<string> = new Set();

    public registerProtocol(protocol: ProtocolDefinition): void {
        if (this.protocols.has(protocol.id)) {
            const existing = this.protocols.get(protocol.id)!;
            if (!this.isCompatibleVersion(existing.version, protocol.compatibleVersions)) {
                throw new Error(`Incompatible protocol version ${protocol.version}`);
            }
        }
        
        if (protocol.deprecated) {
            this.emit('protocolDeprecated', protocol);
        }
        
        this.protocols.set(protocol.id, protocol);
        this.emit('protocolRegistered', protocol);
    }

    public activateProtocol(protocolId: string): void {
        const protocol = this.protocols.get(protocolId);
        if (!protocol) {
            throw new Error(`Protocol ${protocolId} not found`);
        }
        this.activeProtocols.add(protocolId);
        this.emit('protocolActivated', protocol);
    }

    public async handleMessage(protocolId: string, type: string, message: unknown): Promise<unknown> {
        const protocol = this.protocols.get(protocolId);
        if (!protocol || !this.activeProtocols.has(protocolId)) {
            throw new Error(`Protocol ${protocolId} not active`);
        }

        const validator = protocol.validators.get(type);
        if (validator && !validator(message)) {
            throw new Error(`Invalid message format for type ${type}`);
        }

        const handler = protocol.handlers.get(type);
        if (!handler) {
            throw new Error(`No handler for message type ${type}`);
        }

        return await handler(message);
    }

    public getProtocol(protocolId: string): ProtocolDefinition | undefined {
        return this.protocols.get(protocolId);
    }

    public listProtocols(): ProtocolDefinition[] {
        return Array.from(this.protocols.values());
    }

    private isCompatibleVersion(version: string, range?: VersionRange): boolean {
        if (!range) return true;
        return semver.satisfies(version, `>=${range.min} <=${range.max}`);
    }
}
