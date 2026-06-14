import { Request } from 'express';
import { ChatService } from '../services/chat.service';
import { CreateMessageDto } from '../dtos/message.dto';
/**
 * Chat Controller
 *
 * Handles all chat-related operations including room management, messaging,
 * and chat analytics. This controller provides RESTful API endpoints for
 * chat functionality and is protected by authentication guard.
 *
 * The controller supports:
 * - Room creation and management
 * - Message sending and retrieval
 * - Pagination for message history
 * - Chat analytics and statistics
 * - Real-time messaging capabilities
 *
 * @example
 * // Get all chat rooms
 * GET /chat/rooms
 *
 * @example
 * // Send a message
 * POST /chat/rooms/room123/messages
 * {
 *   "content": "Hello everyone!",
 *   "type": "text",
 *   "metadata": {}
 * }
 */
export declare class ChatController {
    private readonly chatService;
    /**
     * Constructor for ChatController
     *
     * @param chatService - The chat service instance for handling business logic
     *
     * @example
     * const controller = new ChatController(chatService);
     */
    constructor(chatService: ChatService);
    /**
     * Get all available chat rooms
     *
     * Returns a list of all chat rooms that the current user has access to.
     * This includes both public rooms and private rooms where the user is a member.
     *
     * @returns Promise containing array of chat rooms
     * @returns[].id - Unique room identifier
     * @returns[].name - Room name/title
     * @returns[].description - Room description
     * @returns[].type - Room type ('public', 'private', 'group')
     * @returns[].createdAt - Room creation timestamp
     * @returns[].updatedAt - Room last update timestamp
     * @returns[].memberCount - Number of room members
     * @returns[].isMember - Whether current user is a member
     *
     * @throws UnauthorizedException - When user is not authenticated
     * @throws InternalServerErrorException - When room retrieval fails
     *
     * @api
     * GET /chat/rooms
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const rooms = await chatController.getRooms();
     *
     * @example
     * // Successful response
     * [
     *   {
     *     "id": "room123",
     *     "name": "General Discussion",
     *     "description": "General chat for everyone",
     *     "type": "public",
     *     "createdAt": "2025-01-01T00:00:00.000Z",
     *     "updatedAt": "2025-11-05T02:17:55.000Z",
     *     "memberCount": 25,
     *     "isMember": true
     *   }
     * ]
     */
    getRooms(): Promise<{
        rooms: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * Get specific chat room by ID
     *
     * Retrieves detailed information about a specific chat room including
     * member list, room settings, and recent activity.
     *
     * @param roomId - Unique room identifier
     *
     * @returns Promise containing room details
     * @returns.id - Room identifier
     * @returns.name - Room name
     * @returns.description - Room description
     * @returns.type - Room type
     * @returns.settings - Room-specific settings
     * @returns.members - Array of room members
     * @returns.recentActivity - Recent room activity summary
     *
     * @throws NotFoundException - When room is not found
     * @throws ForbiddenException - When user doesn't have access to room
     * @throws UnauthorizedException - When user is not authenticated
     *
     * @api
     * GET /chat/rooms/:roomId
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const room = await chatController.getRoom('room123');
     *
     * @example
     * // Successful response
     * {
     *   "id": "room123",
     *   "name": "Project Team",
     *   "description": "Discussion for project team members",
     *   "type": "private",
     *   "settings": {
     *     "allowFileUploads": true,
     *     "maxMessageLength": 2000,
     *     "messageRetention": 90
     *   },
     *   "members": [
     *     {
     *       "id": "user123",
     *       "name": "John Doe",
     *       "role": "admin"
     *     }
     *   ],
     *   "recentActivity": {
     *     "lastMessage": "2025-11-05T02:15:00.000Z",
     *     "messageCount": 156
     *   }
     * }
     */
    getRoom(roomId: string): Promise<any>;
    /**
     * Get messages from a specific room with pagination
     *
     * Retrieves messages from the specified room with support for pagination.
     * Messages are returned in chronological order (oldest first) with
     * the ability to limit results and skip earlier messages.
     *
     * @param roomId - Unique room identifier
     * @param limit - Maximum number of messages to return (default: 50, max: 100)
     * @param offset - Number of messages to skip (for pagination, default: 0)
     *
     * @returns Promise containing paginated messages
     * @returns[].id - Unique message identifier
     * @returns[].content - Message content
     * @returns[].type - Message type ('text', 'image', 'file', 'system')
     * @returns[].sender - Message sender information
     * @returns[].createdAt - Message timestamp
     * @returns[].metadata - Additional message metadata
     * @returns[].reactions - Message reactions/emoji
     * @returns[].replyTo - Reference to parent message if this is a reply
     *
     * @throws NotFoundException - When room is not found
     * @throws ForbiddenException - When user doesn't have access to room
     * @throws BadRequestException - When pagination parameters are invalid
     *
     * @api
     * GET /chat/rooms/:roomId/messages
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const messages = await chatController.getMessages('room123', 20, 0);
     *
     * @example
     * // Successful response
     * {
     *   "messages": [
     *     {
     *       "id": "msg123",
     *       "content": "Hello team!",
     *       "type": "text",
     *       "sender": {
     *         "id": "user123",
     *         "name": "John Doe",
     *         "avatar": "https://example.com/avatar.jpg"
     *       },
     *       "createdAt": "2025-11-05T02:00:00.000Z",
     *       "metadata": {},
     *       "reactions": [
     *         {
     *           "emoji": "👍",
     *           "count": 3,
     *           "users": ["user456", "user789", "user101"]
     *         }
     *       ],
     *       "replyTo": null
     *     }
     *   ],
     *   "pagination": {
     *     "hasMore": true,
     *     "nextOffset": 20,
     *     "total": 156
     *   }
     * }
     */
    getMessages(roomId: string, limit: number, offset: number): Promise<any[]>;
    /**
     * Send a new message to a room
     *
     * Creates and sends a new message to the specified room. The message
     * will be broadcast to all room members in real-time via WebSocket
     * if they are connected.
     *
     * @param roomId - Unique room identifier
     * @param createMessageDto - Message data for creation
     * @param createMessageDto.content - Message content (text, encoded file data, etc.)
     * @param createMessageDto.type - Message type ('text', 'image', 'file', 'system')
     * @param createMessageDto.metadata - Additional message metadata (optional)
     * @param createMessageDto.replyTo - ID of message being replied to (optional)
     *
     * @returns Promise containing created message details
     * @returns.id - Created message identifier
     * @returns.content - Message content
     * @returns.type - Message type
     * @returns.sender - Message sender information
     * @returns.createdAt - Message creation timestamp
     * @returns.status - Message status ('sent', 'delivered', 'read')
     *
     * @throws NotFoundException - When room is not found
     * @throws ForbiddenException - When user doesn't have permission to send messages
     * @throws BadRequestException - When message content is invalid or too long
     * @throws RateLimitException - When user sends messages too quickly
     *
     * @api
     * POST /chat/rooms/:roomId/messages
     * @requiresAuth - Bearer token in Authorization header
     *
     * @example
     * const message = await chatController.sendMessage('room123', {
     *   content: "Hello everyone!",
     *   type: "text"
     * });
     *
     * @example
     * // Successful response
     * {
     *   "id": "msg456",
     *   "content": "Hello everyone!",
     *   "type": "text",
     *   "sender": {
     *     "id": "user123",
     *     "name": "John Doe",
     *     "avatar": "https://example.com/avatar.jpg"
     *   },
     *   "createdAt": "2025-11-05T02:17:55.000Z",
     *   "status": "sent"
     * }
     *
     * @example
     * // File upload message
     * {
     *   "content": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
     *   "type": "image",
     *   "metadata": {
     *     "filename": "screenshot.jpg",
     *     "size": 245760,
     *     "mimeType": "image/jpeg"
     *   }
     * }
     */
    sendMessage(roomId: string, createMessageDto: CreateMessageDto, req: Request): Promise<any>;
    /**
     * Get chat analytics and statistics
     *
     * Returns comprehensive chat analytics including message counts, user activity,
     * popular rooms, and other metrics. This endpoint is commonly used for
     * dashboard views and admin reports.
     *
     * @returns Promise containing chat analytics data
     * @returns.totalMessages - Total number of messages across all rooms
     * @returns.activeRooms - Number of active chat rooms
     * @returns.activeUsers - Number of active users in the last 24 hours
     * @returns.messageTrend - Daily message counts for the last 30 days
     * @returns.popularRooms - Top rooms by message count
     * @returns.userActivity - User engagement statistics
     * @returns.responseTime - Average response time metrics
     * @returns.period - Analytics time period description
     *
     * @throws UnauthorizedException - When user is not authenticated
     * @throws ForbiddenException - When user doesn't have permission to view analytics
     * @throws InternalServerErrorException - When analytics calculation fails
     *
     * @api
     * GET /chat/analytics
     * @requiresAuth - Bearer token in Authorization header
     * @requiresPermission - Admin or analytics access
     *
     * @example
     * const analytics = await chatController.getAnalytics();
     *
     * @example
     * // Successful response
     * {
     *   "totalMessages": 15847,
     *   "activeRooms": 12,
     *   "activeUsers": 45,
     *   "messageTrend": [
     *     {
     *       "date": "2025-11-01",
     *       "count": 234
     *     },
     *     {
     *       "date": "2025-11-02",
     *       "count": 187
     *     }
     *   ],
     *   "popularRooms": [
     *     {
     *       "id": "room123",
     *       "name": "General Discussion",
     *       "messageCount": 3240
     *     }
     *   ],
     *   "userActivity": {
     *     "averageMessagesPerUser": 12.5,
     *     "mostActiveUser": "user123",
     *     "peakHour": "14:00"
     *   },
     *   "responseTime": {
     *     "average": 45,
     *     "median": 23,
     *     "p95": 120
     *   },
     *   "period": "Last 30 days"
     * }
     */
    getAnalytics(): Promise<{
        totalRooms: number;
        totalMessages: number;
        activeRooms: number;
        timestamp: Date;
    }>;
}
//# sourceMappingURL=chat.controller.d.ts.map