"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSocketMessageSender = createSocketMessageSender;
function createSocketMessageSender(ws) {
    return {
        async sendSocketMessage(type, payload, options = {}) {
            const { timeoutMs = 30000, retries = 0 } = options;
            return new Promise((resolve, reject) => {
                if (ws.readyState !== 1) { // WebSocket.OPEN = 1
                    reject(new Error('WebSocket is not open'));
                    return;
                }
                const messageId = generateMessageId();
                const message = {
                    type: type,
                    payload,
                    id: messageId,
                    timestamp: Date.now()
                };
                const timeout = setTimeout(() => {
                    reject(new Error(`Message timeout after ${timeoutMs}ms));
        }, timeoutMs);

        // Set up response handler
        const responseHandler = (event: any) => {
          try {
            const response = JSON.parse(event.data?.toString() || event.toString());
            if (response.id === messageId) {
              clearTimeout(timeout);
              ws.removeListener('message', responseHandler);
              resolve({
                success: true,
                data: response.payload || response.data
              });
            }
          } catch (error) {
            // Ignore parsing errors for non-matching messages
          }
        };

        ws.on('message', responseHandler);

        try {
          ws.send(JSON.stringify(message));
        } catch (error) {
          clearTimeout(timeout);
          ws.removeListener('message', responseHandler);
          reject(error);
        }
      });
    }
  };
}

function generateMessageId(): string {`));
                    return `msg_${Date.now()}`;
                    _$;
                    {
                        Math.random().toString(36).substr(2, 9);
                    }
                    `;
};
                });
            });
        }
    };
}
//# sourceMappingURL=sender.js.map