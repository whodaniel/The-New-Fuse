export interface UpgradeOptions {
    target?: string;
    method?: 'curl' | 'npm' | 'pnpm' | 'bun' | 'brew';
}
export interface UpgradeResult {
    success: boolean;
    previousVersion?: string;
    newVersion?: string;
    message: string;
}
export declare class UpgradeService {
    private configDir;
    constructor();
    getCurrentVersion(): string;
    getLatestVersion(): Promise<string>;
    getAvailableVersions(): Promise<string[]>;
    upgrade(options?: UpgradeOptions): Promise<UpgradeResult>;
    private detectInstallMethod;
    private isInstalledViaBrew;
    private isInstalledViaNpm;
    private isInstalledViaPnpm;
    private isInstalledViaBun;
    private upgradeViaNpm;
    private upgradeViaPnpm;
    private upgradeViaBun;
    private upgradeViaBrew;
    private upgradeViaCurl;
    uninstall(): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=UpgradeService.d.ts.map