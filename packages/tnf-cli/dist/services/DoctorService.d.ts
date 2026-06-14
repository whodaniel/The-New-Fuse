export interface HealthCheck {
    name: string;
    status: 'ok' | 'warn' | 'error';
    message: string;
    fix?: string;
}
export declare class DoctorService {
    runChecks(): Promise<HealthCheck[]>;
    shareReport(): Promise<string>;
}
//# sourceMappingURL=DoctorService.d.ts.map