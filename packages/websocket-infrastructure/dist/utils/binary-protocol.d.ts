import { MessageType } from '../types/index.js';
export declare class BinaryProtocol {
    private static readonly logger;
    static encode(data: any): Buffer;
    static decode(buffer: Buffer): any;
    static isBinary(data: any): boolean;
    static toBuffer(data: any): Buffer;
    static getSize(data: any): number;
    static compareWithJSON(data: any): {
        binarySize: number;
        jsonSize: number;
        ratio: number;
        recommendation: 'binary' | 'json';
    };
}
export declare class MessageSerializer {
    private static readonly logger;
    static serialize(data: any, preferBinary?: boolean): {
        data: Buffer | string;
        type: MessageType;
    };
    static deserialize(data: Buffer | string, type: MessageType): any;
}
export declare class ProtocolNegotiator {
    private static readonly logger;
    private supportedProtocols;
    negotiate(clientProtocols: string[]): string;
    addProtocol(protocol: string): void;
    removeProtocol(protocol: string): void;
    isSupported(protocol: string): boolean;
}
//# sourceMappingURL=binary-protocol.d.ts.map