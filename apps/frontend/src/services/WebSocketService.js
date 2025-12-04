/**
 * WebSocket Service Module
 *
 * @description
 * Provides a comprehensive WebSocket service for real-time communication
 * between the frontend and backend services. Manages connection lifecycle,
 * event handling, reconnection logic, and agent-to-agent messaging.
 *
 * This service implements the singleton pattern to ensure consistent
 * WebSocket connections across the application and provides methods
 * for sending messages, handling events, and managing connection state.
 *
 * @since 1.0.0
 * @author Frontend Team
 * @example
 * ```typescript
 * const wsService = WebSocketService.getInstance();
 *
 * // Connect to WebSocket
 * await wsService.connect();
 *
 * // Send a message
 * await wsService.send('agent:chat', { message: 'Hello agent!' });
 *
 * // Listen for responses
 * wsService.on('agent:response', (data) => {
 *   console.log('Received response:', data);
 * });
 * ```
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { io } from 'socket.io-client';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';
// ============================================================================
// WebSocket Service Class
// ============================================================================
/**
 * Comprehensive WebSocket service for real-time communication
 *
 * @description
 * Manages WebSocket connections, event handling, message sending,
 * and reconnection logic. Provides a singleton service that can be
 * used across the entire application for consistent communication.
 *
 * @features
 * - Singleton pattern for consistent connections
 * - Automatic reconnection with exponential backoff
 * - Event-driven architecture
 * - Agent-to-agent messaging support
 * - Connection state monitoring
 * - Error handling and recovery
 * - Authentication support
 *
 * @example
 * ```typescript
 * // Basic usage
 * const wsService = WebSocketService.getInstance();
 * await wsService.connect();
 *
 * // Listen for events
 * wsService.on('agent:message', (data) => {
 *   console.log('Agent message:', data);
 * });
 *
 * // Send message
 * await wsService.send('agent:chat', {
 *   senderId: 'user-agent',
 *   content: 'Hello World!'
 * });
 * ```
 */
var WebSocketService = /** @class */ (function () {
    /**
     * Private constructor for singleton pattern
     *
     * @param config - WebSocket configuration options
     */
    function WebSocketService(config) {
        if (config === void 0) { config = {}; }
        /** Whether service is connecting */
        this.isConnecting = false;
        /** Connection attempt counter */
        this.reconnectionAttempts = 0;
        /** Maximum reconnection attempts */
        this.maxReconnectionAttempts = 5;
        /** Event handler registry */
        this.eventHandlers = new Map();
        // Default configuration
        this.config = __assign({ url: process.env.REACT_APP_API_URL || 'http://localhost:3001', reconnectionAttempts: 5, reconnectionDelay: 1000, autoConnect: false, timeout: 10000 }, config);
        // Initialize event emitter
        this.eventEmitter = new EventEmitter();
        // Initialize socket with configuration
        this.socket = io(this.config.url, __assign({ reconnectionAttempts: this.config.reconnectionAttempts, reconnectionDelay: this.config.reconnectionDelay, autoConnect: this.config.autoConnect, timeout: this.config.timeout, auth: this.config.authToken ? { token: this.config.authToken } : undefined }, this.config.socketOptions));
        // Setup core event handlers
        this.setupCoreEventHandlers();
    }
    /**
     * Get the singleton instance of WebSocketService
     *
     * @description
     * Returns the existing instance or creates a new one if none exists.
     * This ensures consistent WebSocket connections across the application.
     *
     * @param config - Optional configuration for new instance
     * @returns WebSocketService singleton instance
     *
     * @example
     * ```typescript
     * const wsService = WebSocketService.getInstance();
     * // Use the service...
     * ```
     */
    WebSocketService.getInstance = function (config) {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService(config);
        }
        return WebSocketService.instance;
    };
    /**
     * Connect to the WebSocket server
     *
     * @description
     * Establishes connection to the WebSocket server with the configured
     * settings. Handles connection state management and error handling.
     *
     * @param eventHandlers - Optional event handlers for connection events
     * @returns Promise that resolves when connected or rejects on error
     *
     * @throws {Error} If connection fails or times out
     *
     * @example
     * ```typescript
     * await wsService.connect({
     *   onConnect: () => console.log('Connected!'),
     *   onError: (error) => console.error('Connection error:', error),
     * });
     * ```
     */
    WebSocketService.prototype.connect = function () {
        return __awaiter(this, arguments, void 0, function (eventHandlers) {
            var _this = this;
            if (eventHandlers === void 0) { eventHandlers = {}; }
            return __generator(this, function (_a) {
                // Prevent multiple simultaneous connection attempts
                if (this.isConnecting || this.socket.connected) {
                    logger.warn('WebSocket connection already in progress or established');
                    return [2 /*return*/, Promise.resolve()];
                }
                this.isConnecting = true;
                this.reconnectionAttempts = 0;
                logger.info('Connecting to WebSocket server...', {
                    url: this.config.url,
                    attempt: this.reconnectionAttempts + 1,
                });
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var timeoutId = setTimeout(function () {
                            _this.socket.off('connect', onConnect);
                            _this.socket.off('connect_error', onError);
                            _this.isConnecting = false;
                            reject(new Error('Connection timeout'));
                        }, _this.config.timeout);
                        var onConnect = function () {
                            var _a;
                            clearTimeout(timeoutId);
                            _this.isConnecting = false;
                            _this.reconnectionAttempts = 0;
                            logger.info('WebSocket connected successfully');
                            _this.eventEmitter.emit('connectionStateChanged', true);
                            // Call provided event handler
                            (_a = eventHandlers.onConnect) === null || _a === void 0 ? void 0 : _a.call(eventHandlers);
                            resolve();
                        };
                        var onError = function (error) {
                            var _a;
                            clearTimeout(timeoutId);
                            _this.isConnecting = false;
                            logger.error('WebSocket connection error', { error: error.message });
                            // Call provided event handler
                            (_a = eventHandlers.onError) === null || _a === void 0 ? void 0 : _a.call(eventHandlers, error);
                            reject(error);
                        };
                        _this.socket.once('connect', onConnect);
                        _this.socket.once('connect_error', onError);
                        // Register provided event handlers
                        Object.entries(eventHandlers).forEach(function (_a) {
                            var event = _a[0], handler = _a[1];
                            if (handler && event !== 'onConnect' && event !== 'onError') {
                                _this.socket.on(event.replace('on', ''), handler);
                            }
                        });
                        _this.socket.connect();
                    })];
            });
        });
    };
    /**
     * Disconnect from the WebSocket server
     *
     * @description
     * Gracefully disconnects from the WebSocket server and cleans up
     * event handlers and connection state.
     *
     * @param reason - Optional reason for disconnection
     *
     * @example
     * ```typescript
     * await wsService.disconnect('User logged out');
     * ```
     */
    WebSocketService.prototype.disconnect = function () {
        return __awaiter(this, arguments, void 0, function (reason) {
            if (reason === void 0) { reason = 'Manual disconnect'; }
            return __generator(this, function (_a) {
                if (!this.socket.connected) {
                    logger.warn('WebSocket not connected, cannot disconnect');
                    return [2 /*return*/];
                }
                logger.info('Disconnecting from WebSocket server', { reason: reason });
                // Clear all custom event handlers
                this.clearEventHandlers();
                // Disconnect socket
                this.socket.disconnect();
                // Reset state
                this.isConnecting = false;
                this.reconnectionAttempts = 0;
                // Emit connection state change
                this.eventEmitter.emit('connectionStateChanged', false);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Send a message through the WebSocket
     *
     * @description
     * Sends a message to the server with the specified event and data.
     * Returns a promise that resolves when the message is sent successfully.
     *
     * @param event - Event name to emit
     * @param data - Data to send with the event
     * @param callback - Optional callback when server acknowledges receipt
     * @returns Promise that resolves when message is sent
     *
     * @throws {Error} If not connected or message sending fails
     *
     * @example
     * ```typescript
     * // Send agent message
     * await wsService.send('agent:message', {
     *   id: generateMessageId(),
     *   senderId: 'user-agent',
     *   content: 'Hello!',
     *   type: 'chat'
     * });
     * ```
     */
    WebSocketService.prototype.send = function (event, data, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.socket.connected) {
                    throw new Error('WebSocket not connected. Call connect() first.');
                }
                try {
                    logger.debug('Sending WebSocket message', { event: event, data: data });
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            _this.socket.emit(event, data, function (response) {
                                if (callback) {
                                    callback(response);
                                }
                                if (response && response.error) {
                                    reject(new Error(response.error));
                                }
                                else {
                                    resolve();
                                }
                            });
                        })];
                }
                catch (error) {
                    logger.error('Failed to send WebSocket message', { event: event, error: error });
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Register an event listener
     *
     * @description
     * Registers a callback function to handle messages from the server
     * with the specified event name.
     *
     * @param event - Event name to listen for
     * @param callback - Callback function to execute when event is received
     * @returns Function to remove the event listener
     *
     * @example
     * ```typescript
     * const removeListener = wsService.on('agent:message', (data) => {
     *   console.log('Received agent message:', data);
     * });
     *
     * // Remove listener when done
     * removeListener();
     * ```
     */
    WebSocketService.prototype.on = function (event, callback) {
        var _this = this;
        // Register with Socket.IO
        this.socket.on(event, callback);
        // Register with service event emitter
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(callback);
        // Return remover function
        return function () {
            var _a;
            _this.socket.off(event, callback);
            (_a = _this.eventHandlers.get(event)) === null || _a === void 0 ? void 0 : _a.delete(callback);
        };
    };
    /**
     * Remove an event listener
     *
     * @description
     * Removes a previously registered event listener.
     *
     * @param event - Event name
     * @param callback - Callback function to remove
     */
    WebSocketService.prototype.off = function (event, callback) {
        var _a;
        this.socket.off(event, callback);
        (_a = this.eventHandlers.get(event)) === null || _a === void 0 ? void 0 : _a.delete(callback);
    };
    /**
     * Send agent-to-agent message
     *
     * @description
     * Specialized method for sending messages between agents with
     * proper message structure and validation.
     *
     * @param message - Agent message data
     * @returns Promise that resolves when message is sent
     *
     * @example
     * ```typescript
     * await wsService.sendAgentMessage({
     *   id: generateMessageId(),
     *   senderId: 'agent-1',
     *   receiverId: 'agent-2',
     *   content: 'Hello agent 2!',
     *   type: 'chat'
     * });
     * ```
     */
    WebSocketService.prototype.sendAgentMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var agentMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        agentMessage = __assign(__assign({}, message), { id: generateMessageId(), timestamp: new Date() });
                        logger.debug('Sending agent message', {
                            from: agentMessage.senderId,
                            to: agentMessage.receiverId || 'broadcast',
                            type: agentMessage.type,
                        });
                        return [4 /*yield*/, this.send('agent:message', agentMessage)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get current connection status
     *
     * @description
     * Returns information about the current WebSocket connection state.
     *
     * @returns Connection status information
     *
     * @example
     * ```typescript
     * const status = wsService.getStatus();
     * console.log('Connected:', status.connected);
     * console.log('Reconnection attempts:', status.reconnectionAttempts);
     * ```
     */
    WebSocketService.prototype.getStatus = function () {
        return {
            connected: this.socket.connected,
            connecting: this.isConnecting,
            reconnectionAttempts: this.reconnectionAttempts,
            maxReconnectionAttempts: this.maxReconnectionAttempts,
        };
    };
    /**
     * Setup core event handlers for the WebSocket connection
     *
     * @private
     */
    WebSocketService.prototype.setupCoreEventHandlers = function () {
        var _this = this;
        // Connection established
        this.socket.on('connect', function () {
            _this.reconnectionAttempts = 0;
            logger.info('WebSocket connected');
            _this.eventEmitter.emit('connectionStateChanged', true);
        });
        // Connection lost
        this.socket.on('disconnect', function (reason) {
            logger.warn('WebSocket disconnected', { reason: reason });
            _this.eventEmitter.emit('connectionStateChanged', false);
        });
        // Connection error
        this.socket.on('connect_error', function (error) {
            _this.reconnectionAttempts++;
            logger.error('WebSocket connection error', {
                error: error.message,
                attempt: _this.reconnectionAttempts,
            });
            _this.eventEmitter.emit('error', error);
        });
        // Reconnection attempt
        this.socket.on('reconnect_attempt', function (attemptNumber) {
            logger.info('WebSocket reconnection attempt', { attempt: attemptNumber });
            _this.eventEmitter.emit('connectionStateChanged', false);
        });
        // Reconnection successful
        this.socket.on('reconnect', function (attemptNumber) {
            logger.info('WebSocket reconnected successfully', { attempt: attemptNumber });
            _this.reconnectionAttempts = 0;
            _this.eventEmitter.emit('connectionStateChanged', true);
        });
        // Reconnection failed
        this.socket.on('reconnect_failed', function () {
            logger.error('WebSocket reconnection failed after maximum attempts');
            _this.eventEmitter.emit('error', new Error('Reconnection failed'));
        });
        // Core application events
        this.socket.on('agent:message', function (data) {
            logger.debug('Agent message received', {
                from: data.senderId,
                to: data.receiverId,
                type: data.type,
            });
            _this.eventEmitter.emit('agentMessageReceived', data);
        });
        this.socket.on('system:notification', function (notification) {
            logger.debug('System notification received', notification);
            _this.eventEmitter.emit('systemNotification', notification);
        });
        this.socket.on('agent:status', function (status) {
            logger.debug('Agent status update received', status);
            // Handle agent status updates
        });
    };
    /**
     * Clear all registered event handlers
     *
     * @private
     */
    WebSocketService.prototype.clearEventHandlers = function () {
        var _this = this;
        this.eventHandlers.forEach(function (callbacks) {
            callbacks.forEach(function (callback) {
                _this.socket.offAny(callback);
            });
        });
        this.eventHandlers.clear();
    };
    /**
     * Service-level event emitter access
     *
     * @description
     * Allows listening to service-level events like connection state changes.
     *
     * @param event - Event name
     * @param callback - Event handler
     * @returns Function to remove the listener
     */
    WebSocketService.prototype.onServiceEvent = function (event, callback) {
        var _this = this;
        this.eventEmitter.on(event, callback);
        return function () { return _this.eventEmitter.off(event, callback); };
    };
    return WebSocketService;
}());
export { WebSocketService };
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Generate a unique message ID
 *
 * @private
 * @returns Unique message identifier string
 */
function generateMessageId() {
    return "msg_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
}
// ============================================================================
// Export
// ============================================================================
export default WebSocketService;
