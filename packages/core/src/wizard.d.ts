import { ToolManager } from '../tools/tool_manager.js';
interface AnalysisResults {
    [key: string]: unknown;
}
interface VisualizationResults {
    [key: string]: unknown;
}
interface WizardResults {
    analysis: AnalysisResults;
    visualization: VisualizationResults;
}
interface OtherParams {
    [key: string]: unknown;
}
declare class ProjectWizard {
    private toolManager;
    constructor(toolManager: ToolManager);
    run(projectType: string, otherParams?: OtherParams): WizardResults;
}
export { ProjectWizard, WizardResults, OtherParams };
