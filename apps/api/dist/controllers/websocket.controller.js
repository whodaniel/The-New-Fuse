"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WebSocketController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketController = void 0;
const socket_io_1 = require("socket.io");
const node_http_1 = require("node:http");
const common_1 = require("@nestjs/common");
let WebSocketController = WebSocketController_1 = class WebSocketController {
    constructor() {
        /** Logger instance for WebSocket controller operations */
        this.logger = new common_1.Logger(WebSocketController_1.name);
        /** Socket.IO server instance */
        this.io = null;
        /** HTTP server instance */
        this.server = null;
        /** Server running status */
        this.isRunning = false;
    }
    /**
     * Get WebSocket server status and connection information
     *
     * Returns the current status of the WebSocket server, including whether it's
     * running, the number of active connections, and the port it's listening on.
     * This endpoint is useful for monitoring WebSocket server health and capacity.
     *
     * @param req - Express request object
     * @param res - Express response object
     * @returns Promise that resolves when response is sent
     *
     * @api
     * GET /api/websocket/status
     *
     * @example
     * // Status response
     * {
     *   "running": true,
     *   "connections": 25,
     *   "port": 3001
     * }
     */
    async getStatus(req, res) {
        res.json({
            running: this.isRunning,
            connections: this.io ? this.io.engine.clientsCount : 0,
            port: process.env.WS_PORT || 3001
        });
    }
    /**
     * Start the WebSocket server
     *
     * Initializes and starts the Socket.IO WebSocket server on the configured port.
     * The server will be configured with CORS enabled and event handlers set up.
     * If the server is already running, returns a success message without restarting.
     *
     * @param req - Express request object
     * @param res - Express response object
     * @returns Promise that resolves when response is sent
     *
     * @throws Returns 500 status if server startup fails
     *
     * @api
     * POST /api/websocket/start
     *
     * @example
     * // Startup response
     * {
     *   "message": "WebSocket server started successfully",
     *   "port": 3001
     * }
     */
    async startServer(req, res) {
        try {
            if (this.isRunning) {
                res.json({ message: 'WebSocket server is already running' });
                return;
            }
            const port = process.env.WS_PORT || 3001;
            // Create HTTP server for Socket.IO
            this.server = (0, node_http_1.createServer)();
            // Initialize Socket.IO with CORS configuration
            this.io = new socket_io_1.Server(this.server, {
                cors: {
                    origin: "*",
                    methods: ["GET", "POST"]
                }
            });
            // Set up event handlers for connections and subscriptions
            this.setupEventHandlers();
            // Start the server
            this.server.listen(port, () => {
                this.isRunning = true;
                this.logger.log(`WebSocket server started on port ${port}`);
            });
            res.json({
                message: 'WebSocket server started successfully',
                port: port
            });
        }
        catch (error) {
            this.logger.error('Failed to start WebSocket server:', error);
            res.status(500).json({ error: 'Failed to start WebSocket server' });
        }
    }
    /**
     * Stop the WebSocket server
     *
     * Gracefully shuts down the WebSocket server and closes all active connections.
     * If the server is not running, returns a success message. All cleanup is
     * performed including closing the HTTP server and Socket.IO instance.
     *
     * @param req - Express request object
     * @param res - Express response object
     * @returns Promise that resolves when response is sent
     *
     * @throws Returns 500 status if server shutdown fails
     *
     * @api
     * POST /api/websocket/stop
     *
     * @example
     * // Shutdown response
     * {
     *   "message": "WebSocket server stopped successfully"
     * }
     */
    async stopServer(req, res) {
        try {
            if (!this.isRunning) {
                res.json({ message: 'WebSocket server is not running' });
                return;
            }
            if (this.server) {
                this.server.close();
                this.server = null;
            }
            if (this.io) {
                this.io.close();
                this.io = null;
            }
            this.isRunning = false;
            this.logger.log('WebSocket server stopped');
            res.json({ message: 'WebSocket server stopped successfully' });
        }
        catch (error) {
            this.logger.error('Failed to stop WebSocket server:', error);
            res.status(500).json({ error: 'Failed to stop WebSocket server' });
        }
    }
    /**
     * Broadcast message to all connected clients
     *
     * Sends a message event to all currently connected WebSocket clients.
     * This is useful for system-wide notifications, updates, or announcements.
     * Requires the WebSocket server to be running.
     *
     * @param req - Express request object containing broadcast data
     * @param req.body.event - Event name to broadcast
     * @param req.body.data - Data to send with the event
     * @param res - Express response object
     * @returns Promise that resolves when response is sent
     *
     * @throws Returns 400 status if WebSocket server is not running
     * @throws Returns 400 status if event name is missing
     *
     * @api
     * POST /api/websocket/broadcast
     *
     * @example
     * // Broadcast a system notification
     * {
     *   "event": "system:notification",
     *   "data": {
     *     "type": "maintenance",
     *     "message": "System maintenance scheduled for 2:00 AM UTC",
     *     "severity": "info"
     *   }
     * }
     *
     * @example
     * // Broadcast response
     * {
     *   "message": "Message broadcasted successfully",
     *   "event": "system:notification",
     *   "connections": 25
     * }
     */
    async broadcast(req, res) {
        try {
            const { event, data } = req.body;
            if (!this.io) {
                res.status(400).json({ error: 'WebSocket server is not running' });
                return;
            }
            this.io.emit(event, data);
            res.json({
                message: 'Message broadcasted successfully',
                event,
                connections: this.io.engine.clientsCount
            });
        }
        catch (error) {
            this.logger.error('Failed to broadcast message:', error);
            res.status(500).json({ error: 'Failed to broadcast message' });
        }
    }
    /**
     * Set up WebSocket event handlers
     *
     * Configures all Socket.IO event handlers for client connections, subscriptions,
     * and disconnections. This includes handling workflow subscriptions, execution
     * tracking, agent monitoring, and system metrics updates.
     *
     * Event handlers configured:
     * - connection: Initial client connection
     * - workflow:subscribe: Subscribe to workflow updates
     * - workflow:unsubscribe: Unsubscribe from workflow updates
     * - execution:subscribe: Subscribe to execution updates
     * - execution:unsubscribe: Unsubscribe from execution updates
     * - agent:subscribe: Subscribe to agent updates
     * - system:subscribe: Subscribe to system metrics
     * - disconnect: Client disconnection
     * - error: Connection error handling
     *
     * @private
     */
    setupEventHandlers() {
        if (!this.io)
            return;
        this.io.on('connection', (socket) => {
            this.logger.log(`Client connected: ${socket.id}`);
            // Send welcome message to newly connected client
            socket.emit('welcome', {
                message: 'Connected to The New Fuse WebSocket server',
                clientId: socket.id,
                timestamp: new Date().toISOString()
            });
            // Handle workflow events - subscribe to workflow updates
            socket.on('workflow:subscribe', (workflowId) => {
                socket.join(`workflow:${workflowId}`);
                this.logger.log(`Client ${socket.id} subscribed to workflow ${workflowId}`);
            });
            // Handle workflow unsubscribe events
            socket.on('workflow:unsubscribe', (workflowId) => {
                socket.leave(`workflow:${workflowId}`);
                this.logger.log(`Client ${socket.id} unsubscribed from workflow ${workflowId}`);
            });
            // Handle execution events - subscribe to execution updates
            socket.on('execution:subscribe', (executionId) => {
                socket.join(`execution:${executionId}`);
                this.logger.log(`Client ${socket.id} subscribed to execution ${executionId}`);
            });
            // Handle execution unsubscribe events
            socket.on('execution:unsubscribe', (executionId) => {
                socket.leave(`execution:${executionId}`);
                this.logger.log(`Client ${socket.id} unsubscribed from execution ${executionId}`);
            });
            // Handle agent events - subscribe to agent updates
            socket.on('agent:subscribe', (agentId) => {
                socket.join(`agent:${agentId}`);
                this.logger.log(`Client ${socket.id} subscribed to agent ${agentId}`);
            });
            // Handle system monitoring subscription
            socket.on('system:subscribe', () => {
                socket.join('system:monitoring');
                this.logger.log(`Client ${socket.id} subscribed to system monitoring`);
            });
            // Handle client disconnection
            socket.on('disconnect', () => {
                this.logger.log(`Client disconnected: ${socket.id}`);
            });
            // Handle connection errors
            socket.on('error', (error) => {
                this.logger.error(`Socket error for client ${socket.id}:`, error);
            });
        });
    }
    /**
     * Emit workflow update to subscribed clients
     *
     * Sends a workflow update message to all clients subscribed to the specific
     * workflow. This method is called by workflow services to notify clients about
     * workflow status changes, progress updates, or completion events.
     *
     * @param workflowId - Unique identifier of the workflow
     * @param data - Update data to send to subscribers
     *
     * @example
     * // Emit workflow completion
     * websocketController.emitWorkflowUpdate('workflow-123', {
     *   status: 'completed',
     *   result: { output: 'Task completed successfully' },
     *   duration: 45000
     * });
     */
    emitWorkflowUpdate(workflowId, data) {
        if (this.io) {
            this.io.to(`workflow:${workflowId}`).emit('workflow:update', {
                workflowId,
                data,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Emit execution update to subscribed clients
     *
     * Sends an execution update message to all clients subscribed to the specific
     * execution. This method is used to provide real-time feedback on workflow
     * execution progress, step completion, or error states.
     *
     * @param executionId - Unique identifier of the execution
     * @param data - Update data to send to subscribers
     *
     * @example
     * // Emit execution step completion
     * websocketController.emitExecutionUpdate('exec-456', {
     *   step: 'data-processing',
     *   status: 'completed',
     *   progress: 75,
     *   output: 'Data processed successfully'
     * });
     */
    emitExecutionUpdate(executionId, data) {
        if (this.io) {
            this.io.to(`execution:${executionId}`).emit('execution:update', {
                executionId,
                data,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Emit agent update to subscribed clients
     *
     * Sends an agent status update to all clients subscribed to the specific
     * agent. This method is called when agent status changes, metrics update,
     * or when agent-related events occur.
     *
     * @param agentId - Unique identifier of the agent
     * @param data - Update data to send to subscribers
     *
     * @example
     * // Emit agent status change
     * websocketController.emitAgentUpdate('agent-789', {
     *   status: 'active',
     *   metrics: {
     *     responseTime: 1.2,
     *     tasksCompleted: 45,
     *     uptime: 99.8
     *   }
     * });
     */
    emitAgentUpdate(agentId, data) {
        if (this.io) {
            this.io.to(`agent:${agentId}`).emit('agent:update', {
                agentId,
                data,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Emit system metrics to monitoring subscribers
     *
     * Sends real-time system metrics to all clients subscribed to system
     * monitoring. This is used for dashboard updates and real-time system
     * health monitoring.
     *
     * @param metrics - System metrics data to broadcast
     *
     * @example
     * // Emit real-time system metrics
     * websocketController.emitSystemMetrics({
     *   cpu: 25.5,
     *   memory: 67.3,
     *   connections: 142,
     *   throughput: 12.5
     * });
     */
    emitSystemMetrics(metrics) {
        if (this.io) {
            this.io.to('system:monitoring').emit('system:metrics', {
                metrics,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Get the Socket.IO instance
     *
     * Returns the current Socket.IO server instance for use in other services
     * that need direct access to WebSocket functionality. This allows services
     * to send messages, manage connections, or perform advanced WebSocket operations.
     *
     * @returns Socket.IO server instance or null if not running
     *
     * @example
     * // Get Socket.IO instance for custom operations
     * const io = websocketController.getIO();
     * if (io) {
     *   io.to('room-name').emit('custom-event', data);
     * }
     */
    getIO() {
        return this.io;
    }
};
exports.WebSocketController = WebSocketController;
exports.WebSocketController = WebSocketController = WebSocketController_1 = __decorate([
    (0, common_1.Controller)('websocket')
], WebSocketController);
//# sourceMappingURL=websocket.controller.js.map