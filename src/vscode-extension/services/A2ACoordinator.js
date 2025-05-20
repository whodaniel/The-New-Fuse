"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2ACoordinator = void 0;
class A2ACoordinator {
    constructor() {
        this.workers = new Map();
    }
    startWorker(id, handler) {
        this.workers.set(id, handler);
    }
    async dispatchTask(workerId, task) {
        const worker = this.workers.get(workerId);
        if (!worker) {
            throw new Error(`No worker found with id ${workerId}`);
        }
        await worker(task);
    }
}
exports.A2ACoordinator = A2ACoordinator;
//# sourceMappingURL=A2ACoordinator.js.map