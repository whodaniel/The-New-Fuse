export class CollaborationContextManager {
    constructor() {
        this.context = {
            sharedState: {
                currentPhase: 'analysis',
                activeTask: '',
                augment: [],
                trae: []
            },
            messageQueue: new DefaultPriorityQueue(),
            lastSyncTime: new Date()
        };
    }
    getContext() {
        return this.context;
    }
    updatePhase(phase) {
        this.context.sharedState.currentPhase = phase;
        this.context.lastSyncTime = new Date();
    }
    setActiveTask(task) {
        this.context.sharedState.activeTask = task;
        this.context.lastSyncTime = new Date();
    }
    addAgentTask(agent, task) {
        if (agent === 'augment') {
            this.context.sharedState.augment.push(task);
        }
        else {
            this.context.sharedState.trae.push(task);
        }
        this.context.lastSyncTime = new Date();
    }
    sendMessage(message) {
        this.context.messageQueue.enqueue(message, message.priority);
    }
    receiveMessage() {
        return this.context.messageQueue.dequeue();
    }
    getQueueSize() {
        return this.context.messageQueue.size();
    }
}
class DefaultPriorityQueue {
    constructor() {
        this.items = [];
    }
    enqueue(item, priority) {
        this.items.push({ item, priority });
        this.items.sort((a, b) => b.priority - a.priority);
    }
    dequeue() {
        const result = this.items.shift();
        return result?.item;
    }
    size() {
        return this.items.length;
    }
}
//# sourceMappingURL=collaboration-context.js.map