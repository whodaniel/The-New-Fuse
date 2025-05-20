import { ProjectVisualizer } from './fileVisualizer.js';
export declare enum Severity {
    DEPENDENCY_ISSUE = "DEPENDENCY_ISSUE"
}
export declare class VisualizationManager {
    private readonly visualizer;
    constructor(visualizer: ProjectVisualizer);
    generateVisualizations(): Promise<void>;
}
