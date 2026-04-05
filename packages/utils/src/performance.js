exports.PerformanceMonitor = void 0;
class PerformanceMonitor {
    constructor() {
        Object.defineProperty(this, "startTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "endTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "marks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.startTime = Date.now();
        this.endTime = 0;
        this.marks = new Map();
    }
    mark(name) {
        this.marks.set(name, Date.now());
    }
    measure(startMark, endMark) {
        const start = this.marks.get(startMark);
        const end = this.marks.get(endMark);
        if (!start || !end) {
            throw new Error(`Invalid marks: ${startMark} - ${endMark}`);
        }
        return end - start;
    }
    start() {
        this.startTime = Date.now();
    }
    stop() {
        this.endTime = Date.now();
    }
    getDuration() {
        return this.endTime - this.startTime;
    }
    reset() {
        this.startTime = Date.now();
        this.endTime = 0;
        this.marks.clear();
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
export {};
