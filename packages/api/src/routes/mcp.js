import { Router } from 'express';
const router = Router();
/**
 * @swagger
 * /api/mcp/servers:
 *   get:
 *     summary: Get all MCP servers and their status
 *     tags: [MCP]
 *     responses:
 *       200:
 *         description: List of MCP servers
 */
router.get('/servers', async (req, res) => {
    try {
        const mcpBroker = req.app.get('mcpBroker');
        const servers = mcpBroker.getServers();
        const status = await mcpBroker.getServerStatus();
        res.json({
            success: true,
            data: {
                servers,
                status
            }
        });
    }
    catch (error) {
        console.error('Error getting MCP servers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get MCP servers'
        });
    }
});
/**
 * @swagger
 * /api/mcp/servers/status:
 *   get:
 *     summary: Get status of all MCP servers
 *     tags: [MCP]
 *     responses:
 *       200:
 *         description: Status of MCP servers
 */
router.get('/servers/status', async (req, res) => {
    try {
        const mcpBroker = req.app.get('mcpBroker');
        const status = await mcpBroker.getServerStatus();
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        console.error('Error getting MCP server status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get MCP server status'
        });
    }
});
/**
 * @swagger
 * /api/mcp/capabilities:
 *   get:
 *     summary: Get all MCP capabilities
 *     tags: [MCP]
 *     responses:
 *       200:
 *         description: List of MCP capabilities
 */
router.get('/capabilities', (req, res) => {
    try {
        const mcpBroker = req.app.get('mcpBroker');
        const capabilities = mcpBroker.getAllCapabilities();
        res.json({
            success: true,
            data: capabilities
        });
    }
    catch (error) {
        console.error('Error getting MCP capabilities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get MCP capabilities'
        });
    }
});
/**
 * @swagger
 * /api/mcp/tools:
 *   get:
 *     summary: Get all MCP tools
 *     tags: [MCP]
 *     responses:
 *       200:
 *         description: List of MCP tools
 */
router.get('/tools', (req, res) => {
    try {
        const mcpBroker = req.app.get('mcpBroker');
        const tools = mcpBroker.getAllTools();
        res.json({
            success: true,
            data: tools
        });
    }
    catch (error) {
        console.error('Error getting MCP tools:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get MCP tools'
        });
    }
});
/**
 * @swagger
 * /api/mcp/execute:
 *   post:
 *     summary: Execute an MCP directive
 *     tags: [MCP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serverName
 *               - action
 *             properties:
 *               serverName:
 *                 type: string
 *               action:
 *                 type: string
 *               params:
 *                 type: object
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Result of the execution
 */
// Fix the router.post definition using a middleware function pattern
router.post('/execute', (req, res) => {
    (async () => {
        try {
            const { serverName, action, params, metadata } = req.body;
            if (!serverName || !action) {
                return res.status(400).json({
                    success: false,
                    error: 'Server name and action are required'
                });
            }
            const mcpBroker = req.app.get('mcpBroker');
            // Ensure user id exists or default to 'anonymous'
            const sender = req.user?.id || 'anonymous';
            const result = await mcpBroker.executeDirective(serverName, action, params || {}, {
                sender,
                metadata: metadata || {}
            });
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            const err = error;
            console.error('Error executing MCP directive:', err);
            res.status(500).json({
                success: false,
                error: err.message || 'Failed to execute MCP directive'
            });
        }
    })();
});
export default router;
//# sourceMappingURL=mcp.js.map