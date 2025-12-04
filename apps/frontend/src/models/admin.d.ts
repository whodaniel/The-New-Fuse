export interface SystemPreferences {
    settings: Record<string, any>;
}
export interface AdminUser {
    id: string;
    email: string;
    role: string;
    status: string;
}
declare class AdminModel {
    systemPreferences(): Promise<SystemPreferences>;
    getUsers(): Promise<AdminUser[]>;
    updateSystemPreferences(settings: Record<string, any>): Promise<SystemPreferences>;
}
declare const _default: AdminModel;
export default _default;
