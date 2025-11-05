"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAvailability = initAvailability;
const availability_service_1 = __importDefault(require("./availability.service"));
function initAvailability() {
    const { manager } = availability_service_1.default;
    // Example subscriptions — these are intentionally lightweight
    manager.on('agentRegistered', (agent) => {
        console.log('[availability] agentRegistered', agent.id);
    });
    manager.on('agentHeartbeat', (agent) => {
        console.log('[availability] agentHeartbeat', agent.id);
    });
    manager.on('taskAssigned', ({ task, agent, score }) => {
        console.log('[availability] taskAssigned ->', task.id, '->', agent.id, `(score=${score})`);
    });
    manager.on('handlerError', (err) => {
        console.error('[availability] handlerError', err);
    });
    return { manager, forwardEnvelope: availability_service_1.default.forwardEnvelope };
}
exports.default = initAvailability;
//# sourceMappingURL=init-availability.js.map