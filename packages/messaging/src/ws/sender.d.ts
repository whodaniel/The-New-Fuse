import type { WebSocket } from 'ws';
import { MessagePayload, MessageType, SocketMessageOptions, SocketMessageResponse } from '../types';
export interface SocketMessageSender<TMap> {
    sendSocketMessage<T extends MessageType<TMap>>(type: T, payload: MessagePayload<TMap, T>, options?: SocketMessageOptions): Promise<SocketMessageResponse>;
}
export declare function createSocketMessageSender<TMap>(ws: WebSocket): SocketMessageSender<TMap>;
//# sourceMappingURL=sender.d.ts.map