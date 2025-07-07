"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const agentController_1 = require("../controllers/agentController");
const router = express_1.default.Router();
exports.agentRoutes = router;
// Toggle this flag to enable/disable authentication requirement
const REQUIRE_AUTH = process.env.REQUIRE_AUTH !== 'false';
function ensureAuthenticated(req, res, next) {
    if (!REQUIRE_AUTH) {
        // In dev mode, inject a mock user if not present
        if (!req.user) {
            req.user = {
                id: 'dev-user',
                email: 'dev@local',
                name: 'Dev User',
                // Add any other fields your app expects on User
            };
        }
        return next();
    }
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: Authentication required.' });
        return;
    }
    next();
}
router.post('/', ensureAuthenticated, async (req, res) => {
    await agentController_1.agentController.createAgent(req, res);
});
router.get('/', ensureAuthenticated, async (req, res) => {
    await agentController_1.agentController.getAgents(req, res);
});
router.get('/:id', ensureAuthenticated, async (req, res) => {
    await agentController_1.agentController.getAgentById(req, res);
});
router.put('/:id', ensureAuthenticated, async (req, res) => {
    await agentController_1.agentController.updateAgent(req, res);
});
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    await agentController_1.agentController.deleteAgent(req, res);
});
