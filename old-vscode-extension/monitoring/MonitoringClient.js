"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringClient = void 0;
class MonitoringClient {
    constructor() {
        this.events = [];
    }
    trackEvent(type, data) {
        const event = {
            type,
            data,
            timestamp: Date.now()
        };
        this.events.push(event);
    }
    trackError(error, context) {
        const errorMessage = error instanceof Error ? error.message : error;
        this.trackEvent('error', {
            message: errorMessage,
            context
        });
    }
}
exports.MonitoringClient = MonitoringClient;
//# sourceMappingURL=MonitoringClient.js.map