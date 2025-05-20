export interface FeatureToggleContextType {
    enabledFeatures: string[];
    isEnabled(feature: string): boolean;
}
export declare const FeatureToggleContext: import("react").Context<FeatureToggleContextType>;
//# sourceMappingURL=feature-toggle.d.d.ts.map