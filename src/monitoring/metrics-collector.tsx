export interface MetricPoint {
    timestamp: number;
    value: number;
    tags: Record<string, string>;
}

export interface MetricAggregation {
    min: number;
    max: number;
    avg: number;
    count: number;
    sum: number;
}

export class MetricsCollector {
    private metrics: Map<string, MetricPoint[]> = new Map();
    private readonly maxDataPoints: number = 1000;
    private subscribers: Map<string, ((points: MetricPoint[]) => void)[]> = new Map();

    public record(name: string, value: number, tags: Record<string, string> = {}): void {
        const points = this.metrics.get(name) || [];
        points.push({
            timestamp: Date.now(),
            value,
            tags
        });

        if (points.length > this.maxDataPoints) {
            points.shift();
        }

        this.metrics.set(name, points);

        const subscribers = this.subscribers.get(name) || [];
        subscribers.forEach(callback => callback(this.getMetrics(name)));
    }

    public getMetrics(name: string): MetricPoint[] {
        return this.metrics.get(name) || [];
    }

    public subscribe(metricName: string, callback: (points: MetricPoint[]) => void): () => void {
        const subscribers = this.subscribers.get(metricName) || [];
        subscribers.push(callback);
        this.subscribers.set(metricName, subscribers);

        return () => {
            const index = subscribers.indexOf(callback);
            if (index >= 0) {
                subscribers.splice(index, 1);
            }
        };
    }

    public getAggregation(name: string, timeWindow: number = 3600000): MetricAggregation {
        const points = this.getMetrics(name);
        const now = Date.now();
        const filtered = points.filter(p => p.timestamp > now - timeWindow);

        if (filtered.length === 0) {
            return { min: 0, max: 0, avg: 0, count: 0, sum: 0 };
        }

        const values = filtered.map(p => p.value);
        return {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0)
        };
    }
}
