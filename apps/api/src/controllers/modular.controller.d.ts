interface ModularStatusResponse {
    currentBranch: string;
    enabledFeatures: string[];
    availableBranches: string[];
    packageCounts?: {
        total: number;
        core: number;
        feature: number;
    };
}
interface BranchSwitchRequest {
    branch: string;
    force?: boolean;
    pull?: boolean;
}
interface FeatureToggleRequest {
    feature: string;
    installDeps?: boolean;
    build?: boolean;
    clean?: boolean;
}
export declare class ModularController {
    private readonly validBranches;
    private readonly featureMap;
    getStatus(detailed?: string): Promise<ModularStatusResponse>;
    switchBranch(request: BranchSwitchRequest): Promise<{
        success: boolean;
        branch: string;
        pulled: boolean;
        message: string;
    }>;
    enableFeature(request: FeatureToggleRequest): Promise<{
        success: boolean;
        feature: string;
        packages: any;
        installed: boolean;
        built: boolean;
        message: string;
    }>;
    disableFeature(request: FeatureToggleRequest): Promise<{
        success: boolean;
        feature: string;
        cleaned: boolean;
        message: string;
    }>;
    private getPackageCounts;
    private updateWorkspaceConfig;
}
export {};
//# sourceMappingURL=modular.controller.d.ts.map