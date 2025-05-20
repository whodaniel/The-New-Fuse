import { Tool } from '../tools/base.js';
import { ToolManager } from '../tools/tool_manager.js';

interface AnalysisResults {
    // Define the structure of analysis results
    [key: string]: unknown;
}

interface VisualizationResults {
    // Define the structure of visualization results
    [key: string]: unknown;
}

interface WizardResults {
    analysis: AnalysisResults;
    visualization: VisualizationResults;
}

interface OtherParams {
    [key: string]: unknown;
}

class ProjectWizard {
    private toolManager: ToolManager;

    constructor(toolManager: ToolManager) {
        this.toolManager = toolManager;
    }

    public run(projectType: string, otherParams?: OtherParams): WizardResults {
        // Get and use the Project Analyzer tool
        const analyzer = this.toolManager.getTool("Project Analyzer");
        const analysisResults = analyzer.run(otherParams);

        // Get and use the ComfyUI Visualizer tool
        const visualizer = this.toolManager.getTool("ComfyUI Visualizer");
        const visualization = visualizer.run(otherParams);

        // Combine and return results
        return {
            analysis: analysisResults,
            visualization: visualization
        };
    }
}

export { ProjectWizard, WizardResults, OtherParams };
