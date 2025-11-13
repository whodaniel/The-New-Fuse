export declare class CreateWebhookDto {
    name: string;
    url: string;
    events: string[];
    active?: boolean;
    secret?: string;
}
export declare class UpdateWebhookDto {
    name?: string;
    url?: string;
    events?: string[];
    active?: boolean;
    secret?: string;
}
export declare class WebhooksController {
    constructor();
    create(createWebhookDto: CreateWebhookDto): Promise<{
        message: string;
        data: CreateWebhookDto;
    }>;
    findAll(): Promise<{
        message: string;
        data: never[];
    }>;
    findOne(id: string): Promise<{
        message: string;
        return: {
            message: string;
            updated: any;
            data: any;
        };
        $?: never;
    } | {
        message: any;
        $: any;
        return?: never;
    }>;
}
//# sourceMappingURL=webhooks.controller.d.ts.map