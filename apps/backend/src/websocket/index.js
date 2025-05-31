import { Server } from 'socket.io';
import { verifyToken } from '../utils/auth';
// Services instances
let agentService;
let chatService;
export function initializeWebSocket(server, deps) {
    // Store service instances
    agentService = deps.agentService;
    chatService = deps.chatService;
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    // Authentication middleware
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            const decoded = verifyToken(token);
            socket.userId = decoded.id;
            next();
        }
        catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}, User ID: ${socket.userId}`);
        // Handle chat messages
        socket.on('chat:message', async (data) => {
            try {
                // Use the service instance instead of static method
                const message = await chatService.addMessage(socket.userId, data.role, data.content);
                io.to(socket.id).emit('chat:message', message);
            }
            catch (error) {
                console.error('Error handling chat message:', error);
                io.to(socket.id).emit('error', { message: 'Failed to process chat message' });
            }
        });
        // Handle agent status updates
        socket.on('agent:status', async (data) => {
            try {
                // Use the service instance instead of static method
                const agent = await agentService.updateAgentStatus(data.agentId, data.status, socket.userId);
                io.emit('agent:status', { agentId: data.agentId, status: data.status });
            }
            catch (error) {
                console.error('Error updating agent status:', error);
                io.to(socket.id).emit('error', { message: 'Failed to update agent status' });
            }
        });
        // Handle agent-to-agent communication
        socket.on('agent:communicate', async (data) => {
            try {
                // Validate both agents
                const [fromAgent, toAgent] = await Promise.all([
                    // Use service instances instead of static methods
                    agentService.getAgentById(data.fromAgentId, socket.userId),
                    agentService.getAgentById(data.toAgentId, socket.userId)
                ]);
                if (!fromAgent || !toAgent) {
                    return io.to(socket.id).emit('error', { message: 'Agent not found or not authorized' });
                }
                // Emit to the target agent's channel
                io.emit(`agent:${data.toAgentId}`, {
                    type: 'message',
                    from: fromAgent.name,
                    fromId: fromAgent.id,
                    content: data.content,
                    timestamp: new Date().toISOString()
                });
                // Also save the message if needed
                // Implementation for saving messages between agents
            }
            catch (error) {
                console.error('Error with agent communication:', error);
                io.to(socket.id).emit('error', { message: 'Failed to communicate with agent' });
            }
        });
        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
    return io;
}
