import { CommunicationProtocol } from './WebSocketCommunicationProtocol';
type ProtocolConstructor = new (...args: any[]) => CommunicationProtocol;
export declare class ProtocolRegistry {
    private static protocols;
    static registerProtocol(name: string, ctor: ProtocolConstructor): void;
    static getProtocol(name: string): ProtocolConstructor | undefined;
    static listProtocols(): string[];
}
export {};
//# sourceMappingURL=ProtocolRegistry.d.ts.map