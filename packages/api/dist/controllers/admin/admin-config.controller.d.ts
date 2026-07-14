/**
 * Admin Configuration Controller
 * Route: admin/config
 */
import { Response } from 'express';
import { AdminConfigurationService } from '../../services/admin-configuration.service';
interface User {
    id: string;
}
export declare class AdminConfigController {
    private readonly configService;
    constructor(configService: AdminConfigurationService);
    getConfigs(res: Response): Promise<Response<any, Record<string, any>>>;
    updateConfig(body: {
        key: string;
        value: string;
    }, user: User, res: Response): Promise<Response<any, Record<string, any>>>;
}
export {};
//# sourceMappingURL=admin-config.controller.d.ts.map