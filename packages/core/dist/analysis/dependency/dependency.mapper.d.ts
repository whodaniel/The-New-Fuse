export interface DependencyInfo {
    name: string;
    version: string;
    type?: 'direct' | 'dev' | 'peer';
    description?: string;
    vulnerabilities?: VulnerabilityInfo[];
}
export interface VulnerabilityInfo {
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    recommendation?: string;
}
export declare class DependencyMapper {
    mapToDependencyInfo(dependency: any): DependencyInfo;
    private mapToVulnerabilityInfo;
    mapDependencyArray(dependencies: any[]): DependencyInfo[];
}
//# sourceMappingURL=dependency.mapper.d.ts.map