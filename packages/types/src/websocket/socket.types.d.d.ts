import { ServiceStatusType } from '../services/service-types.js';
import { ErrorCode } from '../errors.js';
export interface SocketMessage<T = unknown> {
    type: string;
    payload: T;
    timestamp: Date;
    requestId?: string;
}
export interface SocketError {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
}
export interface SocketEventMap {
    'connect': void;
    'disconnect': void;
    'error': SocketError;
    'status': ServiceStatusType;
    'message': SocketMessage;
}
export type SocketEventHandler<T extends keyof SocketEventMap> = (data: SocketEventMap[T]) => void | Promise<void>;
//# sourceMappingURL=socket.types.d.d.ts.map