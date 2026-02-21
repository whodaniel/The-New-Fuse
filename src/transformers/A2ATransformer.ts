import { Injectable } from '@nestjs/common';
import { A2AMessage } from '../protocols/types.js';

@Injectable()
export class A2ATransformer {
    transformToA2A(data: any, context: any): A2AMessage {
        return {
            type: this.inferMessageType(data),
            payload: this.sanitizePayload(data),
            metadata: {
                timestamp: Date.now(),
                sender: context.nodeId,
                protocol_version: context.protocolVersion
            }
        };
    }

    transformFromA2A(message: A2AMessage): any {
        return {
            data: message.payload,
            context: {
                messageType: message.type,
                timestamp: message.metadata.timestamp,
                source: message.metadata.sender
            }
        };
    }

    private inferMessageType(data: any): string {
        if (data.type) return data.type;
        if (Array.isArray(data)) return 'BATCH';
        if (typeof data === 'object') return 'OBJECT';
        return 'PRIMITIVE';
    }

    private sanitizePayload(data: any): any {
        if (typeof data !== 'object') return { value: data };
        return Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );
    }
}