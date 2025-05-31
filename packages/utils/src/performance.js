exports.PerformanceMonitor = void 0;
class PerformanceMonitor {
    startTime;
    endTime;
    marks;
    constructor() {
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
//# sourceMappingURL=performance.js.map