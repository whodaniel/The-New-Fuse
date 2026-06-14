/**
 * Admin Settings Controller
 * Route: admin/settings
 */
import { Response } from 'express';
import { AdminConfigurationService } from '../../services/admin-configuration.service.js';
interface User {
    id: string;
}
export declare class AdminSettingsController {
    private readonly configService;
    constructor(configService: AdminConfigurationService);
    getSettings(res: Response): Promise<Response<any, Record<string, any>>>;
    updateSettings(settings: any, user: User, res: Response): Promise<Response<any, Record<string, any>>>;
    updateSettingsPost(settings: any, user: User, res: Response): Promise<Response<any, Record<string, any>>>;
}
export {};
//# sourceMappingURL=admin-settings.controller.d.ts.map