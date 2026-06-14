export declare class DrizzleFeedbackRepository {
    create(data: {
        type?: string;
        message: string;
        source?: string;
        contextUrl?: string;
        priority?: string;
        reporterName?: string;
        reporterEmail?: string;
    }): Promise<{
        id: string;
        type: string;
        message: string;
        source: string;
        priority: string;
        status: string;
        createdAt: Date;
    }>;
    findAll(query?: {
        status?: string;
        type?: string;
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    findById(id: string): Promise<any | null>;
    getStats(): Promise<{
        total: number;
        byStatus: Record<string, number>;
        byType: Record<string, number>;
        byPriority: Record<string, number>;
    }>;
}
export declare const drizzleFeedbackRepository: DrizzleFeedbackRepository;
//# sourceMappingURL=feedback.repository.d.ts.map