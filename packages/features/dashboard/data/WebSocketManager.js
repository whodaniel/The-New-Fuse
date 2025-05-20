"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketManager = void 0;
class WebSocketManager {
    constructor() {
        this.ws = null;
        this.subscriptions = new Map();
    }
}
exports.WebSocketManager = WebSocketManager;
NodeJS.Timeout | null;
null;
reconnectAttempt = 0;
constructor(config, types_1.WebSocketConfig);
{
    this.config = {
        reconnect: true,
        reconnectAttempts: 5,
        reconnectDelay: 1000,
        ...config,
    };
    this.connect();
    void {
        try: {
            this: .ws = new WebSocket(this.(config).url, this.(config).protocols)
        }(this).(ws).onopen = () => {
            this.reconnectAttempt = 0;
            this.notifySubscribers({ type: 'connection', status: 'connected' });
        }
    }(this).(ws).onmessage;
    (event) => {
        try {
            const data, {};
            console.error('Failed to parse WebSocket message:', error);
        }
        finally {
        }
    };
    this.(ws).onerror = JSON.parse(event.data);
    this.notifySubscribers(data);
}
try { }
catch (error) { }
(error) => {
    this.(config).onError?.(error);
    this.notifySubscribers({ type: 'error', error });
};
this.(ws).onclose = () => {
    this.(config).onClose?.();
    this.notifySubscribers({ type: 'connection', status: 'disconnected' });
    unknown;
    {
        console.error('WebSocket connection error:', error);
        void {
            if() { }
        }(this).(config).reconnect ||
            (this.(config).reconnectAttempts &&
                this.reconnectAttempt >= this.(config).reconnectAttempts);
        {
            return;
        }
        if (this)
            : unknown;
        {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = setTimeout(() => {
            this.reconnectAttempt++;
            this.connect();
            types_1.SubscriptionConfig;
        });
        () => void {}(this).(subscriptions).set(config.key, config);
        return () => {
            this.(subscriptions).delete(config, unknown);
            void {
                this: .subscriptions.forEach((subscription) => {
                    try {
                        if (!subscription.filter || subscription.filter(data)) {
                            subscription.callback(data);
                            unknown;
                        }
                    }
                    finally { }
                })
            };
            {
                subscription.errorCallback?.(error);
            }
        };
        ;
    }
    send(data, unknown);
    void {
        if() { }
    }(this);
    unknown;
    {
        this.(ws).send(JSON.stringify(data));
    }
    {
        throw new Error('WebSocket is not connected');
        void {
            if() { }
        }(this);
        unknown;
        {
            clearTimeout(this, {
                connected: boolean,
                reconnecting: boolean,
                reconnectAttempt: number
            }, {
                return: {
                    connected: this.ws?.readyState === WebSocket.OPEN,
                    reconnecting: !!this.reconnectTimer,
                    reconnectAttempt: this.reconnectAttempt,
                }
            });
        }
    }
};
//# sourceMappingURL=WebSocketManager.js.map