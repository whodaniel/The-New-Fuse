"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookBridgeImplementation = void 0;
const axios_1 = __importDefault(require("axios"));
// Simple in-memory store for webhook configurations
const webhookConfigStore = new Map();
const deliveryLogStore = new Map();
class WebhookBridgeImplementation {
    config;
    constructor(config) {
        this.config = config;
    }
    async createWebhook(config) {
        console.log('Creating webhook with config:', config);
        const newConfig = {
            id: `webhook-${Date.now()},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...config,
    };
    webhookConfigStore.set(newConfig.id, newConfig);
    return newConfig;
  }

  async deliverEvent(eventType: string, data: Record<string, any>): Promise<WebhookDeliveryLog[]> {`,
            console, : .log(`Delivering event ${eventType}`), with: data, data
        };
        const deliveryLogs = [];
        for (const config of webhookConfigStore.values()) {
            if (config.eventTypes.includes(eventType)) {
                const log = {
                    id: log - $
                }, { Date, now };
                ();
            }
            webhookId: config.id,
                eventType,
                payload;
            data,
                timestamp;
            new Date(),
                status;
            'PENDING',
            ;
        }
        ;
        try {
            const response = await axios_1.default.post(config.url, data, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(config.secret ? { 'X-Webhook-Secret': config.secret } : {}),
                },
                timeout: this.config.defaultTimeout || 5000,
            });
            log.status = 'SUCCESS';
            log.responseStatus = response.status;
            log.responseBody = response.data;
        }
        catch (error) {
            log.status = 'FAILED';
            if (axios_1.default.isAxiosError(error) && error.response) {
                log.responseStatus = error.response.status;
                log.responseBody = error.response.data;
            }
            else {
                log.responseBody = error.message;
            }
        }
        deliveryLogs.push(log);
        if (!deliveryLogStore.has(config.id)) {
            deliveryLogStore.set(config.id, []);
        }
        deliveryLogStore.get(config.id).push(log);
    }
}
exports.WebhookBridgeImplementation = WebhookBridgeImplementation;
return deliveryLogs;
async;
validateWebhook(url, string);
Promise < { isValid: boolean, error: string } > {} `
    console.log(Validating webhook URL: ${url}`;
;
try {
    const response = await axios_1.default.get(url);
    if (response.status >= 200 && response.status < 300) {
        return { isValid: true };
    }
    else {
        return { isValid: false, error: Invalid, status, code: $ };
        {
            response.status;
        }
        ` };
      }
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }
}
        ;
    }
}
finally { }
//# sourceMappingURL=WebhookBridge.js.map