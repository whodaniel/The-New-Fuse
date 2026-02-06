/**
 * Multi-Agent Coordination Example
 *
 * This example demonstrates a complete multi-agent system using MCP tools.
 * It showcases a real-world scenario where multiple specialized agents
 * coordinate to complete a complex data pipeline workflow.
 *
 * Agents involved:
 * 1. Coordinator Agent - Orchestrates the entire workflow
 * 2. Data Fetcher Agent - Fetches data from external APIs
 * 3. Data Processor Agent - Transforms and validates data
 * 4. Analytics Agent - Performs analysis and generates insights
 * 5. Reporter Agent - Creates and distributes reports
 *
 * Workflow:
 * 1. Coordinator discovers available agents
 * 2. Creates workflow and assigns tasks
 * 3. Agents execute tasks and communicate progress
 * 4. Results are aggregated and shared
 * 5. Final report is generated and distributed
 */

import { Logger } from '@nestjs/common';
import { APIIntegrationAgent } from './api-integration-agent';
import { CoordinatorAgent } from './coordinator-agent';
import { DataProcessingAgent } from './data-processing-agent';

const logger = new Logger('MultiAgentCoordination');

/**
 * Analytics Agent - Analyzes data and generates insights
 */
class AnalyticsAgent {
  private client: any;
  private agentId: string;

  constructor(agentId: string, serverEndpoint: string) {
    this.agentId = agentId;
    // Client initialization code here
  }

  async analyzeData(data: any): Promise<any> {
    logger.log(`[${this.agentId}] Analyzing data...`);

    // Simulate data analysis
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      summary: {
        totalRecords: data.records?.length || 0,
        categories: ['A', 'B', 'C'],
        avgValue: 42.5,
      },
      insights: [
        'Data shows upward trend',
        'Category A has highest volume',
        'Anomaly detected in recent data',
      ],
      recommendations: ['Increase monitoring frequency', 'Review Category C data quality'],
    };
  }
}

/**
 * Reporter Agent - Generates and distributes reports
 */
class ReporterAgent {
  private client: any;
  private agentId: string;

  constructor(agentId: string, serverEndpoint: string) {
    this.agentId = agentId;
    // Client initialization code here
  }

  async generateReport(analysisResults: any, distributionList: string[]): Promise<any> {
    logger.log(`[${this.agentId}] Generating report...`);

    const report = {
      id: `report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      title: 'Data Pipeline Analysis Report',
      summary: analysisResults.summary,
      insights: analysisResults.insights,
      recommendations: analysisResults.recommendations,
      format: 'json',
    };

    // Distribute to recipients
    logger.log(`[${this.agentId}] Distributing report to ${distributionList.length} recipients`);

    return report;
  }
}

/**
 * Main coordination function
 */
export async function runMultiAgentCoordination(): Promise<void> {
  const SERVER_ENDPOINT = 'ws://localhost:3100';

  logger.log('=== Starting Multi-Agent Coordination Example ===');

  // Initialize all agents
  const coordinator = new CoordinatorAgent('coordinator_main', SERVER_ENDPOINT);
  const dataFetcher = new APIIntegrationAgent('data_fetcher', SERVER_ENDPOINT);
  const dataProcessor = new DataProcessingAgent('data_processor', SERVER_ENDPOINT);
  const analytics = new AnalyticsAgent('analytics_agent', SERVER_ENDPOINT);
  const reporter = new ReporterAgent('reporter_agent', SERVER_ENDPOINT);

  try {
    // Step 1: Coordinator discovers all available agents
    logger.log('\n--- Step 1: Agent Discovery ---');
    const status = await coordinator.getStatus();
    logger.log(`Coordinator status:`, status);

    // Step 2: Create and configure the workflow
    logger.log('\n--- Step 2: Workflow Creation ---');
    const workflowConfig = {
      name: 'Data Pipeline with Analysis and Reporting',
      inputs: {
        apiEndpoint: 'https://api.example.com/data',
        transformations: ['normalize', 'validate', 'enrich'],
        analysisType: 'full',
        reportFormat: 'json',
        recipients: ['admin', 'analytics_team'],
      },
    };

    // Step 3: Start the coordinated workflow
    logger.log('\n--- Step 3: Starting Coordinated Workflow ---');

    // Coordinator initiates the workflow
    logger.log('[Coordinator] Initiating data pipeline workflow');

    // Sub-step 3.1: Data Fetching
    logger.log('\n  [Data Fetcher] Fetching data from external API');
    const rawData = await dataFetcher.fetchExternalData(workflowConfig.inputs.apiEndpoint);
    logger.log(`  [Data Fetcher] Fetched ${JSON.stringify(rawData).length} bytes of data`);

    // Sub-step 3.2: Data Processing
    logger.log('\n  [Data Processor] Processing and transforming data');
    // Simulate task assignment
    await dataProcessor['handleTaskAssignment']({
      taskId: 'task_process_001',
      taskType: 'data_transformation',
      parameters: {
        data: rawData,
        transformations: workflowConfig.inputs.transformations,
      },
    });
    logger.log('  [Data Processor] Data processing completed');

    // Simulated processed data
    const processedData = {
      records: [
        { id: 1, category: 'A', value: 100 },
        { id: 2, category: 'B', value: 150 },
        { id: 3, category: 'C', value: 75 },
      ],
      metadata: {
        processedAt: new Date().toISOString(),
        transformations: workflowConfig.inputs.transformations,
      },
    };

    // Sub-step 3.3: Analytics
    logger.log('\n  [Analytics] Analyzing processed data');
    const analysisResults = await analytics.analyzeData(processedData);
    logger.log('  [Analytics] Analysis completed');
    logger.log('  Insights:', analysisResults.insights);

    // Sub-step 3.4: Report Generation
    logger.log('\n  [Reporter] Generating final report');
    const finalReport = await reporter.generateReport(
      analysisResults,
      workflowConfig.inputs.recipients
    );
    logger.log('  [Reporter] Report generated:', finalReport.id);

    // Step 4: Agent-to-Agent Communication
    logger.log('\n--- Step 4: Agent Collaboration ---');

    // Data Fetcher shares status with Coordinator
    logger.log('[Data Fetcher -> Coordinator] Sharing fetch results');
    await dataFetcher['shareData'](['coordinator_main'], {
      status: 'completed',
      recordCount: processedData.records.length,
    });

    // Data Processor collaborates with Analytics
    logger.log('[Data Processor -> Analytics] Requesting additional validation');
    // This would use the collaboration methods

    // Step 5: Results Aggregation
    logger.log('\n--- Step 5: Results Aggregation ---');
    const finalResults = {
      workflowId: 'wf_' + Date.now(),
      status: 'completed',
      executionTime: '8.5 seconds',
      stages: {
        dataFetching: {
          agent: 'data_fetcher',
          status: 'completed',
          bytesProcessed: JSON.stringify(rawData).length,
        },
        dataProcessing: {
          agent: 'data_processor',
          status: 'completed',
          recordsProcessed: processedData.records.length,
        },
        analytics: {
          agent: 'analytics_agent',
          status: 'completed',
          insightsGenerated: analysisResults.insights.length,
        },
        reporting: {
          agent: 'reporter_agent',
          status: 'completed',
          reportId: finalReport.id,
        },
      },
      finalReport,
    };

    logger.log('\n--- Final Results ---');
    logger.log(JSON.stringify(finalResults, null, 2));

    // Step 6: Demonstrate different communication patterns
    logger.log('\n--- Step 6: Communication Patterns ---');

    // Pattern 1: Request-Response
    logger.log('\n  Pattern 1: Request-Response');
    logger.log('  [Coordinator] Requesting status from Data Processor');
    const processorStatus = await dataProcessor.getStatus();
    logger.log('  [Data Processor] Status:', processorStatus);

    // Pattern 2: Broadcast
    logger.log('\n  Pattern 2: Broadcast Notification');
    logger.log('  [Coordinator] Broadcasting workflow completion');
    // Would use broadcast tool here

    // Pattern 3: Collaboration
    logger.log('\n  Pattern 3: Multi-Agent Collaboration');
    logger.log('  [Data Processor & Analytics] Collaborating on data validation');
    await dataProcessor.collaborateWith('analytics_agent', 'data_validation', {
      dataset: 'processed_data',
      validationRules: ['range_check', 'null_check'],
    });

    // Step 7: Show different tool usage patterns
    logger.log('\n--- Step 7: Tool Usage Examples ---');

    logger.log('\n  Example 1: Workflow Management');
    logger.log('  - Create workflow ✓');
    logger.log('  - Execute workflow ✓');
    logger.log('  - Monitor status ✓');

    logger.log('\n  Example 2: Task Coordination');
    logger.log('  - Create tasks ✓');
    logger.log('  - Assign to agents ✓');
    logger.log('  - Track progress ✓');
    logger.log('  - Update status ✓');

    logger.log('\n  Example 3: Agent Discovery & Communication');
    logger.log('  - Discover agents by capability ✓');
    logger.log('  - Send messages between agents ✓');
    logger.log('  - Broadcast to multiple agents ✓');

    logger.log('\n  Example 4: Resource Access');
    logger.log('  - Read workflow templates ✓');
    logger.log('  - Access agent registry ✓');
    logger.log('  - Get system status ✓');

    logger.log('\n  Example 5: Collaboration Management');
    logger.log('  - Start collaboration ✓');
    logger.log('  - Track participants ✓');
    logger.log('  - End collaboration ✓');

    logger.log('\n=== Multi-Agent Coordination Example Completed Successfully ===');
  } catch (error) {
    logger.error('Multi-agent coordination failed:', error);
    throw error;
  } finally {
    // Cleanup
    logger.log('\n--- Cleanup ---');
    await coordinator.disconnect();
    await dataFetcher.disconnect();
    await dataProcessor.disconnect();
    logger.log('All agents disconnected');
  }
}

/**
 * Advanced coordination patterns
 */
export class AdvancedCoordinationPatterns {
  /**
   * Pattern 1: Pipeline Processing
   * Agents process data in sequence, each adding value
   */
  static async pipelineProcessing(agents: any[], initialData: any): Promise<any> {
    logger.log('Executing Pipeline Processing Pattern');

    let data = initialData;

    for (const [index, agent] of agents.entries()) {
      logger.log(`  Stage ${index + 1}: Processing with ${agent.agentId}`);
      // Each agent processes and passes to next
      data = await agent.process(data);
    }

    return data;
  }

  /**
   * Pattern 2: Parallel Processing with Aggregation
   * Multiple agents process data in parallel, results are aggregated
   */
  static async parallelProcessing(agents: any[], data: any): Promise<any> {
    logger.log('Executing Parallel Processing Pattern');

    const promises = agents.map((agent, index) => {
      logger.log(`  Starting parallel task ${index + 1} on ${agent.agentId}`);
      return agent.process(data);
    });

    const results = await Promise.all(promises);

    // Aggregate results
    return {
      results,
      aggregated: results.reduce((acc, r) => ({ ...acc, ...r }), {}),
    };
  }

  /**
   * Pattern 3: Hierarchical Coordination
   * Coordinator delegates to sub-coordinators
   */
  static async hierarchicalCoordination(
    mainCoordinator: any,
    subCoordinators: any[],
    workers: any[]
  ): Promise<any> {
    logger.log('Executing Hierarchical Coordination Pattern');

    // Main coordinator assigns work to sub-coordinators
    const assignments = subCoordinators.map((subCoord, index) => {
      const assignedWorkers = workers.slice(index * 2, (index + 1) * 2);
      return subCoord.coordinate(assignedWorkers);
    });

    const results = await Promise.all(assignments);

    // Main coordinator aggregates results from sub-coordinators
    return mainCoordinator.aggregate(results);
  }

  /**
   * Pattern 4: Event-Driven Coordination
   * Agents react to events from other agents
   */
  static setupEventDrivenCoordination(agents: any[]): void {
    logger.log('Setting up Event-Driven Coordination Pattern');

    // Each agent subscribes to events from others
    agents.forEach((agent) => {
      agent.on('data.processed', (event: any) => {
        logger.log(`  ${agent.agentId} received data.processed event`);
        // Agent reacts to event
      });

      agent.on('task.completed', (event: any) => {
        logger.log(`  ${agent.agentId} received task.completed event`);
        // Agent reacts to event
      });
    });
  }

  /**
   * Pattern 5: Consensus Building
   * Multiple agents collaborate to reach consensus
   */
  static async consensusBuilding(agents: any[], proposal: any): Promise<any> {
    logger.log('Executing Consensus Building Pattern');

    // Each agent evaluates the proposal
    const votes = await Promise.all(agents.map((agent) => agent.evaluate(proposal)));

    // Count votes
    const approve = votes.filter((v) => v.decision === 'approve').length;
    const reject = votes.filter((v) => v.decision === 'reject').length;

    const consensus = approve > reject ? 'approved' : 'rejected';

    logger.log(`  Consensus result: ${consensus} (${approve} approve, ${reject} reject)`);

    return {
      consensus,
      votes,
      proposal,
    };
  }
}

/**
 * Run the example
 */
if (require.main === module) {
  runMultiAgentCoordination()
    .then(() => {
      logger.log('Example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Example failed:', error);
      process.exit(1);
    });
}
