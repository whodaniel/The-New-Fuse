"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
import error_1 from '../error.js';
import telemetry_1 from '../../../../models/telemetry';
/**
 * HTTP Interface plugin for Aibitat to emulate a websocket interface in the agent
 * framework so we dont have to modify the interface for passing messages and responses
 * in REST or WSS.
 */
const httpSocket = {
    name: 'httpSocket',
    startupConfig: {
        params: {
            handler: {
                required: true,
            },
            muteUserReply: {
                required: false,
                default: true,
            },
            introspection: {
                required: false,
                default: true,
            },
        },
    },
    plugin: function ({ handler, muteUserReply = true, // Do not post messages to "USER" back to frontend.
    introspection = false, // when enabled will attach socket to Aibitat object with .introspect method which reports status updates to frontend.
     }) {
        return {
            name: this.name,
            setup(aibitat) {
                aibitat.onError(async () => , () => , (error) => {
                    if (!!error?.message) {
                        console.error(chalk_1.default.red(`   error: ${error.message}`), error);
                        aibitat.introspect(`Error encountered while running: ${error.message}`);
                    }
                    if (error instanceof error_1.RetryError) {
                        console.error(chalk_1.default.red(`   retrying in 60 seconds...`));
                        setTimeout(() => {
                            aibitat.retry();
                        }, 60000);
                        return;
                    }
                });
                aibitat.introspect = (messageText) => {
                    if (!introspection)
                        return; // Dump thoughts when not wanted.
                    handler.emit('message', JSON.stringify({ type: 'statusResponse', content: messageText }));
                };
                // expose function for sockets across aibitat
                // type param must be set or else msg will not be shown or handled in UI.
                aibitat.socket = {
                    send: (type = '__unhandled', content = '') => {
                        handler.emit('message', JSON.stringify({ type, content }));
                    },
                };
                // We can only receive one message response with HTTP
                // so we end on first response.
                aibitat.onMessage((message) => {
                    if (message.from !== 'USER')
                        telemetry_1.Telemetry.sendTelemetry('agent_chat_sent');
                    if (message.from === 'USER' && muteUserReply)
                        return;
                    handler.emit('message', JSON.stringify(message));
                    handler.disconnect();
                });
                aibitat.onTerminate(() => {
                    handler.disconnect();
                });
            },
        };
    },
};
module.exports = {
    httpSocket,
};
export {};
//# sourceMappingURL=http-socket.js.map