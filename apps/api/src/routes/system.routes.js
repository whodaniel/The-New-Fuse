/**
 * System Routes - System health and management endpoints
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
export function createSystemRoutes(systemController) {
    const router = Router();
    // Public health endpoint (no auth required)
    router.get('/health', systemController.getHealth.bind(systemController));
    // Protected endpoints
    router.use(authMiddleware);
    router.get('/metrics', systemController.getMetrics.bind(systemController));
    router.get('/status', systemController.getStatus.bind(systemController));
    router.get('/logs', systemController.getLogs.bind(systemController));
    router.post('/restart', systemController.restart.bind(systemController));
    return router;
}
//# sourceMappingURL=system.routes.js.map