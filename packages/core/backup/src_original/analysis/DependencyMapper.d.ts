export interface DependencyNode {
    id: string;
    type: string;
    dependencies: string[];
    dependents: string[];
}
export declare class DependencyMapper {
    private nodes;
}
