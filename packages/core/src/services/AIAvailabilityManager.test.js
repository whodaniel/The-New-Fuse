"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const AIAvailabilityManager_1 = __importDefault(require("./AIAvailabilityManager"));
async function runTests() {
    const manager = new AIAvailabilityManager_1.default({ heartbeatTTL: 2000 });
    // Register an agent
    const a = manager.registerAgent({ id: 'agent-1', name: 'Agent One', type: 'extension', capabilities: ['c1'], metadata: {} });
    assert_1.default.strictEqual(a.id, 'agent-1');
    // Heartbeat should update lastSeen
    const before = a.lastSeen;
    await new Promise((r) => setTimeout(r, 10));
    manager.handleHeartbeat('agent-1', { name: 'Agent One' });
    const after = manager.listAgents().find((x) => x.id === 'agent-1').lastSeen;
    assert_1.default.ok(after >= before);
    // find best agent for a task with capability c1
    const task = { id: 't1', type: 'simple', constraints: { capabilities: ['c1'] } };
    const chosen = manager.findBestAgentForTask(task);
    assert_1.default.ok(chosen && chosen.agent.id === 'agent-1');
    // assign task
    const assigned = manager.assignTask({ id: 't2', type: 'simple' });
    assert_1.default.ok(assigned && assigned.id === 'agent-1');
    // prune stale: simulate old lastSeen
    const agents = manager.listAgents();
    agents.forEach((ag) => (ag.lastSeen = Date.now() - 10_000));
    const removed = manager.pruneStale();
    assert_1.default.ok(removed.length > 0, 'should have removed stale agents');
    console.log('AIAvailabilityManager tests passed');
}
runTests().catch((err) => {
    console.error('Tests failed', err);
    process.exit(1);
});
//# sourceMappingURL=AIAvailabilityManager.test.js.map