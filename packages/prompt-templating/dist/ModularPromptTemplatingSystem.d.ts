import React from 'react';
interface VersionMetric {
    totalRuns: number;
    successRate: number;
    avgResponseTime: number;
}
interface Version {
    id: string | number;
    version: string | number;
    label: string;
    name?: string;
    metrics?: VersionMetric;
    variables?: Record<string, any>;
}
interface TemplateAnalytics {
    successRate?: number;
    popularVariables?: string[];
}
interface Template {
    analytics?: TemplateAnalytics;
    versions: Version[];
}
interface ModularPromptTemplatingSystemProps {
    template?: Template;
    currentVersion?: Version;
    getLabelStyle: (label: string) => string;
    Target: React.ElementType;
    GitBranch: React.ElementType;
    Variable: React.ElementType;
}
declare const ModularPromptTemplatingSystem: React.FC<ModularPromptTemplatingSystemProps>;
export default ModularPromptTemplatingSystem;
//# sourceMappingURL=ModularPromptTemplatingSystem.d.ts.map