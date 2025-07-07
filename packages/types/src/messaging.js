"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityQueue = void 0;
class PriorityQueue {
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
exports.PriorityQueue = PriorityQueue;
