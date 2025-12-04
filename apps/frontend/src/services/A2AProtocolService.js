var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
// A2A Message Schema (v1.0)
var a2aMessageV1Schema = z.object({
    id: z.string(),
    type: z.string(),
    timestamp: z.number(),
    sender: z.string(),
    recipient: z.string().optional(),
    payload: z.any(),
    metadata: z.object({
        priority: z.enum(['low', 'medium', 'high']),
        timeout: z.number().optional(),
        retryCount: z.number().optional(),
        protocol_version: z.string()
    })
});
// A2A Message Schema (v2.0)
var a2aMessageV2Schema = z.object({
    header: z.object({
        id: z.string(),
        type: z.string(),
        version: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
        source: z.string(),
        target: z.string().optional()
    }),
    body: z.object({
        content: z.any(),
        metadata: z.object({
            sent_at: z.number(),
            timeout: z.number().optional(),
            retries: z.number().optional(),
            trace_id: z.string().optional()
        })
    })
});
/**
 * Service for A2A protocol operations
 */
var A2AProtocolService = /** @class */ (function () {
    function A2AProtocolService(defaultProtocolVersion) {
        if (defaultProtocolVersion === void 0) { defaultProtocolVersion = '1.0'; }
        this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        this.defaultProtocolVersion = defaultProtocolVersion;
    }
    /**
     * Creates a new A2A message
     * @param type Message type
     * @param payload Message payload
     * @param sender Message sender
     * @param recipient Message recipient
     * @param options Additional options
     * @returns The created message
     */
    A2AProtocolService.prototype.createMessage = function (type, payload, sender, recipient, options) {
        if (options === void 0) { options = {}; }
        var protocolVersion = options.protocolVersion || this.defaultProtocolVersion;
        if (protocolVersion === '2.0') {
            return this.createMessageV2(type, payload, sender, recipient, options);
        }
        return this.createMessageV1(type, payload, sender, recipient, options);
    };
    /**
     * Creates a new A2A message (v1.0)
     * @param type Message type
     * @param payload Message payload
     * @param sender Message sender
     * @param recipient Message recipient
     * @param options Additional options
     * @returns The created message
     */
    A2AProtocolService.prototype.createMessageV1 = function (type, payload, sender, recipient, options) {
        if (options === void 0) { options = {}; }
        return {
            id: uuidv4(),
            type: type,
            timestamp: Date.now(),
            sender: sender,
            recipient: recipient,
            payload: payload,
            metadata: {
                priority: options.priority || 'medium',
                timeout: options.timeout,
                retryCount: options.retryCount,
                protocol_version: '1.0'
            }
        };
    };
    /**
     * Creates a new A2A message (v2.0)
     * @param type Message type
     * @param payload Message payload
     * @param sender Message sender
     * @param recipient Message recipient
     * @param options Additional options
     * @returns The created message
     */
    A2AProtocolService.prototype.createMessageV2 = function (type, payload, sender, recipient, options) {
        if (options === void 0) { options = {}; }
        return {
            header: {
                id: uuidv4(),
                type: type,
                version: '2.0',
                priority: options.priority || 'medium',
                source: sender,
                target: recipient
            },
            body: {
                content: payload,
                metadata: {
                    sent_at: Date.now(),
                    timeout: options.timeout,
                    retries: options.retryCount,
                    trace_id: uuidv4()
                }
            }
        };
    };
    /**
     * Transforms a message from one version to another
     * @param message The message to transform
     * @param targetVersion The target version
     * @returns The transformed message
     */
    A2AProtocolService.prototype.transformMessage = function (message, targetVersion) {
        // Determine current version
        var currentVersion = this.getMessageVersion(message);
        // If already in target version, return as is
        if (currentVersion === targetVersion) {
            return message;
        }
        // Transform from v1 to v2
        if (currentVersion === '1.0' && targetVersion === '2.0') {
            var v1Message = message;
            return {
                header: {
                    id: v1Message.id,
                    type: v1Message.type,
                    version: '2.0',
                    priority: v1Message.metadata.priority,
                    source: v1Message.sender,
                    target: v1Message.recipient
                },
                body: {
                    content: v1Message.payload,
                    metadata: {
                        sent_at: v1Message.timestamp,
                        timeout: v1Message.metadata.timeout,
                        retries: v1Message.metadata.retryCount,
                        trace_id: uuidv4()
                    }
                }
            };
        }
        // Transform from v2 to v1
        if (currentVersion === '2.0' && targetVersion === '1.0') {
            var v2Message = message;
            return {
                id: v2Message.header.id,
                type: v2Message.header.type,
                timestamp: v2Message.body.metadata.sent_at,
                sender: v2Message.header.source,
                recipient: v2Message.header.target,
                payload: v2Message.body.content,
                metadata: {
                    priority: v2Message.header.priority,
                    timeout: v2Message.body.metadata.timeout,
                    retryCount: v2Message.body.metadata.retries,
                    protocol_version: '1.0'
                }
            };
        }
        throw new Error("Unsupported version transformation: ".concat(currentVersion, " -> ").concat(targetVersion));
    };
    /**
     * Gets the version of a message
     * @param message The message
     * @returns The message version
     */
    A2AProtocolService.prototype.getMessageVersion = function (message) {
        if ('header' in message && message.header.version) {
            return message.header.version;
        }
        if ('metadata' in message && message.metadata.protocol_version) {
            return message.metadata.protocol_version;
        }
        return '1.0'; // Default to v1.0
    };
    /**
     * Validates a message
     * @param message The message to validate
     * @returns The validated message
     */
    A2AProtocolService.prototype.validateMessage = function (message) {
        var version = this.getMessageVersion(message);
        if (version === '2.0') {
            return a2aMessageV2Schema.parse(message);
        }
        return a2aMessageV1Schema.parse(message);
    };
    /**
     * Sends a message
     * @param message The message to send
     * @returns The response
     */
    A2AProtocolService.prototype.sendMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // Validate message
                        this.validateMessage(message);
                        return [4 /*yield*/, fetch("".concat(this.apiBaseUrl, "/a2a/messages"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(message)
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to send message: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error sending message:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Broadcasts a message
     * @param message The message to broadcast
     * @returns The response
     */
    A2AProtocolService.prototype.broadcastMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // Validate message
                        this.validateMessage(message);
                        return [4 /*yield*/, fetch("".concat(this.apiBaseUrl, "/a2a/broadcast"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(message)
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to broadcast message: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Error broadcasting message:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Sends a request and waits for a response
     * @param message The request message
     * @param timeout Timeout in milliseconds
     * @returns The response
     */
    A2AProtocolService.prototype.sendRequestAndWaitForResponse = function (message_1) {
        return __awaiter(this, arguments, void 0, function (message, timeout) {
            var response, error_3;
            if (timeout === void 0) { timeout = 30000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // Validate message
                        this.validateMessage(message);
                        return [4 /*yield*/, fetch("".concat(this.apiBaseUrl, "/a2a/request"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-Request-Timeout': timeout.toString()
                                },
                                body: JSON.stringify(message)
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to send request: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Error sending request:', error_3);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return A2AProtocolService;
}());
export { A2AProtocolService };
// Create singleton instance
export var a2aProtocolService = new A2AProtocolService();
