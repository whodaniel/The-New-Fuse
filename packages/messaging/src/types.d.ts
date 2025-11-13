export type MessagePayload<TMap, TType extends MessageType<TMap>> = TMap[TType];
export type MessageType<TMap> = keyof TMap;
export interface SocketMessage<T = any> {
    type: string;
    payload: T;
    id?: string;
    timestamp?: number;
}
export interface SocketMessageOptions {
    timeoutMs?: number;
    retries?: number;
}
export interface SocketMessageResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}
//# sourceMappingURL=types.d.ts.map