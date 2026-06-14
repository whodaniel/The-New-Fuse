export declare class FeatureController {
    getFeatureFlags(): Promise<{
        id: string;
        name: string;
        description: string;
        enabled: boolean;
        rolloutPercentage: number;
    }[]>;
    updateFeatureFlag(id: string, body: {
        enabled: boolean;
    }): Promise<{
        id: string;
        name: string;
        description: string;
        enabled: boolean;
        rolloutPercentage: number;
    } | {
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=feature.controller.d.ts.map