import { Tool } from '../tools/types';

interface ToolManager {
  getTool(name: string): any;
}

export class ProjectWizard {
  constructor(private toolManager: ToolManager) {}

  async analyzeProject(): Promise<{ analysis: any; visualization: any }> {
    const analyzer = this.toolManager.getTool('Project Analyzer');
    const visualizer = this.toolManager.getTool('ComfyUI Visualizer');

    if (analyzer && visualizer) {
      const analysis = await analyzer.analyze();
      const visualization = await visualizer.visualize(analysis);
      return { analysis, visualization };
    }

    throw new Error('Required tools not available');
  }
}
