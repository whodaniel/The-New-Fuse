import { AlertService } from './alerts/AlertService.js';
interface Alert {
    name: string;
    condition: () => boolean;
    message: string;
}
export declare class AlertManager {
    private readonly alertService;
    private readonly logger;
    private readonly alerts;
    constructor(alertService: AlertService);
    createAlert(alert: Alert): void;
    checkAlerts(): void;
}
export {};
//# sourceMappingURL=AlertManager.d.ts.map