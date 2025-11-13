export declare class WebhookRepository {
    constructor();
    create(data: any): Promise<any>;
    findAll(): Promise<never[]>;
    findById(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
}
//# sourceMappingURL=webhook.repository.d.ts.map