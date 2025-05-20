import { z } from 'zod';
export declare const MessageHeaderSchema: z.string;
export declare const MessagePayloadSchema: z.string;
export declare const MessageSchema: MessageHeaderSchema, payload: MessagePayloadSchema, signature: z.string;
export type MessageHeader = z.object;
