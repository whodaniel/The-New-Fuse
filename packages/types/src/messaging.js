export class PriorityQueue {
    items = [];
    enqueue(item, priority = 0) {
        this.items.push({ item, priority });
        this.items.sort((a, b) => b.priority - a.priority);
    }
    dequeue() {
        return this.items.shift()?.item;
    }
    isEmpty() {
        return this.items.length === 0;
    }
    size() {
        return this.items.length;
    }
}
//# sourceMappingURL=messaging.js.map