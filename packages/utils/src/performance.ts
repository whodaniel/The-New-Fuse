
export {}
exports.PerformanceMonitor = void 0;

class PerformanceMonitor {
    private startTime: number;
    private endTime: number;
    private marks: Map<string, number>;

    constructor() {
        this.startTime = Date.now();
        this.endTime = 0;
        this.marks = new Map();
    }

    mark(name: string): void {
        this.marks.set(name, Date.now());
    }

    measure(startMark: string, endMark: string): number {
        const start = this.marks.get(startMark);
        const end = this.marks.get(endMark);
        if (!start || !end) {
            throw new Error(`Invalid marks: ${startMark} - ${endMark}`);
        }
        return end - start;
    }

    start(): void {
        this.startTime = Date.now();
    }

    stop(): void {
        this.endTime = Date.now();
    }

    getDuration(): number {
        return this.endTime - this.startTime;
    }

    reset(): void {
        this.startTime = Date.now();
        this.endTime = 0;
        this.marks.clear();
    }
}

exports.PerformanceMonitor = PerformanceMonitor;
