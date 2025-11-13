export declare class WebhooksService {
    constructor();
    create(data: any): Promise<any>;
    findAll(): Promise<never[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, data: any): Promise<any>;
    remove(id: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
}
//# sourceMappingURL=webhooks.service.d.ts.map