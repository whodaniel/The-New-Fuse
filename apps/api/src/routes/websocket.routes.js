/**
 * WebSocket Routes - Real-time communication endpoints
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
export function createWebSocketRoutes(webSocketController) {
    const router = Router();
    // Apply authentication middleware
    router.use(authMiddleware);
    // WebSocket server management
    router.get('/status', webSocketController.getStatus.bind(webSocketController));
    router.post('/start', webSocketController.startServer.bind(webSocketController));
    router.post('/stop', webSocketController.stopServer.bind(webSocketController));
    router.post('/broadcast', webSocketController.broadcast.bind(webSocketController));
    return router;
}
//# sourceMappingURL=websocket.routes.js.map