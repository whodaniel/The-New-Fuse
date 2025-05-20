import { JsonValue, DataMap } from './common-types.js';
declare module 'ws' {
    interface WebSocketMessage {
        payload: DataMap;
        metadata: Record<string, JsonValue>;
    }
}
//# sourceMappingURL=ws.d.d.ts.map