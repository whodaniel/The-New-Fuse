import { NestMiddleware } from '@nestjs/common';
import { CascadeService } from '../services/CascadeService.js';
export declare class CascadeMiddleware implements NestMiddleware {
    private readonly cascadeService;
    constructor(cascadeService: CascadeService);
    use(): Promise<void>;
}
