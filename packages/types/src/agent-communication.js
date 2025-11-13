export class PriorityQueue {
    items = [];
    enqueue(item, priority = 0) {
        const queueItem = { item, priority };
        // Find the correct position to insert based on priority (higher priority first)
        let inserted = false;
        for (let i = 0; i < this.items.length; i++) {
            if (queueItem.priority > this.items[i].priority) {
                this.items.splice(i, 0, queueItem);
                inserted = true;
                break;
            }
        }
        // If not inserted, add to the end
        if (!inserted) {
            this.items.push(queueItem);
        }
    }
    dequeue() {
        const queueItem = this.items.shift();
        return queueItem?.item;
    }
    peek() {
        return this.items[0]?.item;
    }
    isEmpty() {
        return this.items.length === 0;
    }
    size() {
        return this.items.length;
    }
    clear() {
        this.items = [];
    }
}
//# sourceMappingURL=agent-communication.js.map