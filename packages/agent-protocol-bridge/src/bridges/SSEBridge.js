"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSEBridgeImplementation = void 0;
// Simple in-memory store for SSE subscriptions
const sseSubscriptionStore = new Map();
class SSEBridgeImplementation {
    config;
    constructor(config) {
        this.config = config;
    }
    async createConnection(clientId, response) {
        console.log(`Creating SSE connection for client ${clientId});
    // In a real implementation, you would set up the SSE connection here.
    // For this simulation, we don't need to do anything.
    return;
  }

  async subscribe(clientId: string, eventTypes: string[]): Promise<SseSubscription> {`, console.log(`Subscribing client ${clientId}`, to, event, types, eventTypes));
        const subscription = {
            id: sse - sub - $
        }, { Date, now };
        ();
    }
    clientId;
    eventTypes;
    createdAt;
}
exports.SSEBridgeImplementation = SSEBridgeImplementation;
;
sseSubscriptionStore.set(subscription.id, subscription);
return subscription;
async;
broadcast(event, (Omit));
Promise < integration_bridge_types_1.SseBroadcastResult > {
    console, : .log('Broadcasting SSE event:', event),
    const: result, SseBroadcastResult: integration_bridge_types_1.SseBroadcastResult = {
        totalTargeted: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        deliveredTo: [],
        errors: [],
    },
    for(, sub, of, sseSubscriptionStore) { }, : .values()
};
{
    if (sub.eventTypes.includes(event.type)) {
        result.totalTargeted++;
        try {
            // In a real implementation, you would write the event to the client's response stream.
            // For this simulation, we'll just log it.`
            console.log(Delivering, SSE, event, to, client, $, { sub, : .clientId } `:, event);
          result.successfulDeliveries++;
          result.deliveredTo.push(sub.clientId);
        } catch (error) {
          result.failedDeliveries++;
          result.errors.push({ clientId: sub.clientId, error: error.message });
        }
      }
    }

    return result;
  }

  async closeConnection(clientId: string): Promise<void> {
    console.log(Closing SSE connection for client ${clientId}`);
            // In a real implementation, you would close the SSE connection here.
            // For this simulation, we can just remove any subscriptions for this client.
            for (const [id, sub] of sseSubscriptionStore.entries()) {
                if (sub.clientId === clientId) {
                    sseSubscriptionStore.delete(id);
                }
            }
            return;
        }
        finally {
        }
    }
}
//# sourceMappingURL=SSEBridge.js.map