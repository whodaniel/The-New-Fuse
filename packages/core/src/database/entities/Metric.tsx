import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    UpdateDateColumn
} from 'typeorm';

@Entity('metrics')
@Index(['name', 'type', 'timestamp']) // Index for common query patterns
export class Metric {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    @Index()
    name: string;

    @Column('float')
    value: number;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    timestamp: Date;

    @Column({ length: 50 })
    @Index()
    type: string; // e.g., 'gauge', 'counter', 'histogram'

    @Column({ length: 100, nullable: true })
    @Index()
    source?: string;

    @Column('jsonb', { nullable: true })
    tags?: Record<string, string>;

    // Optional: Add a last updated column if metrics can be updated
    @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
    updatedAt?: Date;

    constructor(partial: Partial<Metric>) {
        Object.assign(this, partial);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            value: this.value,
            timestamp: this.timestamp,
            type: this.type,
            source: this.source,
            tags: this.tags,
            updatedAt: this.updatedAt
        };
    }

    static createPerformanceMetric(data: {
        duration: number;
        operation: string;
        success: boolean;
        metadata?: Record<string, any>;
    }): Metric {
        const metric = new Metric();
        metric.type = 'performance';
        metric.data = {
            ...data,
            metadata: data.metadata || {}
        };
        return metric;
    }

    static createErrorMetric(data: {
        error: string;
        stack?: string;
        context?: Record<string, any>;
    }): Metric {
        const metric = new Metric();
        metric.type = 'error';
        metric.data = {
            ...data,
            metadata: data.metadata || {}
        };
        return metric;
    }

    static createUsageMetric(data: {
        endpoint: string;
        userId?: string;
        responseTime: number;
        statusCode: number;
        metadata?: Record<string, any>;
    }): Metric {
        const metric = new Metric();
        metric.type = 'usage';
        metric.data = {
            ...data,
            metadata: data.metadata || {}
        };
        return metric;
    }
}
