"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import core_1 from '@nestjs/core';
import agent_workflow_1 from './agent-workflow.js';
import agent_entity_1 from '@the-new-fuse/core/entities/agent.entity';
import data_analysis_1 from '@the-new-fuse/core/tools/data-analysis';
import visualization_1 from '@the-new-fuse/core/tools/visualization';
import statistical_1 from '@the-new-fuse/core/tools/statistical';
async function runExample() {
    const agent = new agent_entity_1.Agent({
        name: 'Data Analysis Assistant',
        description: 'AI assistant specialized in data analysis',
        capabilities: ['data-analysis', 'visualization', 'statistics']
    });
    const app = await core_1.NestFactory.create(AppModule);
    const workflowExample = app.get(agent_workflow_1.AgentWorkflowExample);
    const agentSetup = await workflowExample.setupAgent(agent);
    
    const tools = [
        new data_analysis_1.DataAnalysisTool(),
        new visualization_1.VisualizationTool(),
        new statistical_1.StatisticalTool()
    ].map(tool => ({
        name: tool.name,
        description: tool.description
    }));
    const dataset = {
        name: 'sales_data_2024',
        summary: 'Monthly sales data for all products in 2024',
        schema: {
            date: 'DATE',
            product_id: 'STRING',
            quantity: 'INTEGER',
            revenue: 'FLOAT',
            customer_segment: 'STRING'
        },
    };
    try {
        const query = `Analyze the sales trends for 2024. 
                      I'm particularly interested in:
                      1. Monthly revenue trends
                      2. Top performing products
                      3. Customer segment analysis
                      Please include visualizations where appropriate.`;
        const analysisResult = await workflowExample.runAnalysis(agent, query, dataset, tools);

    }
    catch (error) {
        console.error('Analysis failed:', error);
    }
}
runExample().catch(console.error);
//# sourceMappingURL=usage-example.js.map