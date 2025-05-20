import { NestFactory } from '@nestjs/core';
import { AgentWorkflowExample } from './agent-workflow.js';
import { Agent } from '@the-new-fuse/core/entities/agent.entity';
import { DataAnalysisTool } from '@the-new-fuse/core/tools/data-analysis';
import { VisualizationTool } from '@the-new-fuse/core/tools/visualization';
import { StatisticalTool } from '@the-new-fuse/core/tools/statistical';

async function runExample(): any {
    // 1. Create a new agent
    const agent = new Agent({
        name: 'Data Analysis Assistant',
        description: 'AI assistant specialized in data analysis',
        capabilities: ['data-analysis', 'visualization', 'statistics']
    });

    // 2. Initialize the workflow example
    const app = await NestFactory.create(AppModule);
    const workflowExample = app.get(AgentWorkflowExample);

    // 3. Set up the agent with LLM configuration and prompts
    const agentSetup = await workflowExample.setupAgent(agent);

    // 4. Define available tools
    const tools = [
        new DataAnalysisTool(),
        new VisualizationTool(),
        new StatisticalTool()
    ].map(tool => ({
        name: tool.name,
        description: tool.description
    }));

    // 5. Example dataset
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
        // Example data would be here
    };

    // 6. Run an analysis
    try {
        const query = `Analyze the sales trends for 2024. 
                      I'm particularly interested in:
                      1. Monthly revenue trends
                      2. Top performing products
                      3. Customer segment analysis
                      Please include visualizations where appropriate.`;

        const analysisResult = await workflowExample.runAnalysis(
            agent,
            query,
            dataset,
            tools
        );

        // 7. The response will be in the specified markdown format with:
        // - Detailed analysis
        // - Key insights
        // - Recommendations
        // - Generated code (if any)
        
    } catch (error) {
        console.error('Analysis failed:', error);
    }
}

// Run the example
runExample().catch(console.error);
