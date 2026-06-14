import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class ServiceCategoryRouterService {
    private readonly eventEmitter;
    private readonly logger;
    constructor(eventEmitter: EventEmitter2);
    routeServiceRequest(categoryId: string, request: any): Promise<any>;
}
//# sourceMappingURL=service-category-router.service.d.ts.map