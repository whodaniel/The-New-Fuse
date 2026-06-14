/**
 * WebSocket Controller
 *
 * Manages real-time bidirectional communication using Socket.IO for The New Fuse
 * platform. This controller provides WebSocket server lifecycle management,
 * connection handling, event broadcasting, and real-time updates for workflows,
 * executions, agents, and system monitoring.
 *
 * The controller supports:
 * - Dynamic WebSocket server start/stop control
 * - Real-time connection management
 * - Event-based communication channels
 * - Workflow and execution tracking
 * - Agent status updates
 * - System metrics broadcasting
 * - Room-based messaging for targeted updates
 *
 * Key Features:
 * - CORS-enabled for cross-origin requests
 * - Room-based subscriptions for efficient messaging
 * - Automatic connection tracking and logging
 * - Error handling and reconnection support
 * - Broadcast capabilities for system-wide notifications
 *
 * @example
 * // Start the WebSocket server
 * POST /api/websocket/start
 *
 * @example
 * // Check server status and connections
 * GET /api/websocket/status
 *
 * @example
 * // Broadcast a message to all connected clients
 * POST /api/websocket/broadcast
 * {
 *   "event": "system:notification",
 *   "data": { "message": "Maintenance scheduled" }
 * }
 *
 * @example
 * // Client connection and subscription
 * const socket = io('ws://localhost:3001');
 * socket.emit('workflow:subscribe', 'workflow-123');
 * socket.on('workflow:update', (data: any) => console.log(data));
 */
import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
export declare class WebSocketController {
    /** Logger instance for WebSocket controller operations */
    private logger;
    /** Socket.IO server instance */
    private io;
    /** HTTP server instance */
    private server;
    /** Server running status */
    private isRunning;
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
    getStatus(req: Request, res: Response): Promise<void>;
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
    startServer(req: Request, res: Response): Promise<void>;
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
    stopServer(req: Request, res: Response): Promise<void>;
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
    broadcast(req: Request, res: Response): Promise<void>;
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
    private setupEventHandlers;
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
    emitWorkflowUpdate(workflowId: string, data: unknown): void;
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
    emitExecutionUpdate(executionId: string, data: unknown): void;
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
    emitAgentUpdate(agentId: string, data: unknown): void;
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
    emitSystemMetrics(metrics: unknown): void;
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
    getIO(): SocketIOServer | null;
}
//# sourceMappingURL=websocket.controller.d.ts.map