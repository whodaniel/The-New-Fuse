/**
 * Data Pipeline Example Application
 * 
 * Demonstrates a complete data processing pipeline using all unified framework components:
 * - Master Agent Registry for agent management
 * - Workflow Engine for orchestration
 * - Extension System for custom functionality
 */

import { Logger, MasterAgentRegistry, HeartbeatMonitoringService } from '@the-new-fuse/relay-core';
// import { WorkflowEngineFactory } from '@the-new-fuse/workflow-engine'; // Removed workflow-engine dependency
import { ExtensionSystemFactory } from '@the-new-fuse/extension-system';
// import { WorkflowNodeType } from '@the-new-fuse/workflow-engine/types'; // Removed workflow-engine dependency
import { DrizzleClient } from '@drizzle/client';
import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * Data Pipeline Application
 * 
 * This example shows how to build a comprehensive data processing pipeline
 * that processes CSV files, validates data, performs analysis, and generates reports.
 */
export class DataPipelineApp {
  private logger: Logger;
  private drizzle: DrizzleClient;
  private agentRegistry: MasterAgentRegistry;
  private heartbeatService: HeartbeatMonitoringService;
  private workflowEngine: any;
  private extensionManager: any;

  constructor() {
    this.logger = new Logger({
      level: 'info',
      silent: false
    });
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Data Pipeline Application...');

    // Setup database
    this.drizzle = new DrizzleClient({
      datasources: {
        db: {
          url: 'file:./data-pipeline.db'
        }
      }
    });

    // Setup Master Agent Registry
    const agentConfig = {
      enableMerkleTree: true,
      enableSpreadsheetIntegration: false,
      enableHeartbeatMonitoring: true,
      onboardingRequired: true,
      protocolComplianceRequired: true,
      redisConnection: null,
      maxAgents: 50,
      stagnationThresholdMs: 300000, // 5 minutes
      cleanupIntervalMs: 60000 // 1 minute
    };

    this.agentRegistry = new MasterAgentRegistry(agentConfig, this.drizzle, this.logger);

    // Setup Heartbeat Monitoring
    const heartbeatConfig = {
      checkIntervalMs: 10000, // 10 seconds
      stagnationThresholdMs: 300000, // 5 minutes
      maxMissedHeartbeats: 3,
      enableAutoRemediation: true
    };

    this.heartbeatService = new HeartbeatMonitoringService(heartbeatConfig, this.agentRegistry, this.logger);

    // Setup Workflow Engine
    this.workflowEngine = WorkflowEngineFactory.createDefault(
      this.drizzle,
      this.agentRegistry,
      this.heartbeatService,
      this.logger
    );

    // Setup Extension System
    const extensionDir = path.join(__dirname, '../examples/extensions');
    await fs.ensureDir(extensionDir);

    this.extensionManager = ExtensionSystemFactory.createDefault(
      extensionDir,
      this.logger,
      this.agentRegistry,
      this.workflowEngine.engine
    );

    // Initialize all systems
    await this.agentRegistry.initialize();
    await this.heartbeatService.initialize();
    await this.extensionManager.initialize();

    this.logger.info('Data Pipeline Application initialized successfully');
  }

  /**
   * Setup the data processing pipeline
   */
  async setupPipeline(): Promise<void> {
    this.logger.info('Setting up data processing pipeline...');

    // Create custom extensions for data processing
    await this.createDataProcessingExtensions();

    // Register specialized agents
    await this.registerSpecializedAgents();

    // Create the main data processing workflow
    await this.createDataProcessingWorkflow();

    this.logger.info('Data processing pipeline setup complete');
  }

  /**
   * Create custom extensions for data processing
   */
  private async createDataProcessingExtensions(): Promise<void> {
    const extensionDir = path.join(__dirname, '../examples/extensions');

    // CSV Parser Extension
    await this.createExtension(extensionDir, 'csv-parser', 'workflow_node', `
class CSVParser {
  constructor(config) {
    this.config = config;
    this.name = 'csv-parser';
  }

  async onLoad(context) {
    this.logger = context.logger;
    this.logger.info('CSV Parser extension loaded');
  }

  async execute(input) {
    const { data, options = {} } = input;
    
    try {
      // Simulate CSV parsing
      if (typeof data === 'string' && data.includes(',')) {
        const lines = data.split('\\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || null;
          });
          return row;
        });

        return {
          success: true,
          data: {
            headers,
            rows,
            count: rows.length
          },
          metadata: {
            parser: 'csv-parser',
            timestamp: new Date(),
            options
          }
        };
      } else {
        throw new Error('Invalid CSV data format');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

module.exports = CSVParser;
`);

    // Data Validator Extension
    await this.createExtension(extensionDir, 'data-validator', 'agent_capability', `
class DataValidator {
  constructor(config) {
    this.config = config;
    this.name = 'data-validator';
  }

  async onLoad(context) {
    this.logger = context.logger;
    this.logger.info('Data Validator extension loaded');
  }

  async validate(data, rules = {}) {
    const { rows } = data;
    const errors = [];
    const validRows = [];
    
    rows.forEach((row, index) => {
      const rowErrors = [];
      
      // Validate required fields
      if (rules.required) {
        rules.required.forEach(field => {
          if (!row[field] || row[field] === null || row[field] === '') {
            rowErrors.push(`Required field '${field}' is missing`);
          }
        });
      }
      
      // Validate data types
      if (rules.types) {
        Object.entries(rules.types).forEach(([field, type]) => {
          if (row[field] !== null && row[field] !== undefined) {
            if (type === 'number' && isNaN(Number(row[field]))) {
              rowErrors.push(`Field '${field}' must be a number`);
            } else if (type === 'email' && !row[field].includes('@')) {
              rowErrors.push(`Field '${field}' must be a valid email`);
            }
          }
        });
      }
      
      if (rowErrors.length > 0) {
        errors.push({ row: index + 1, errors: rowErrors });
      } else {
        validRows.push(row);
      }
    });
    
    return {
      valid: errors.length === 0,
      validRows,
      errors,
      statistics: {
        totalRows: rows.length,
        validRows: validRows.length,
        errorRows: errors.length,
        validationRate: (validRows.length / rows.length) * 100
      }
    };
  }
}

module.exports = DataValidator;
`);

    // Data Analytics Extension
    await this.createExtension(extensionDir, 'data-analytics', 'workflow_node', `
class DataAnalytics {
  constructor(config) {
    this.config = config;
    this.name = 'data-analytics';
  }

  async onLoad(context) {
    this.logger = context.logger;
    this.logger.info('Data Analytics extension loaded');
  }

  async execute(input) {
    const { data, analysisType = 'comprehensive' } = input;
    const { rows } = data;
    
    try {
      const analytics = {
        summary: {
          totalRecords: rows.length,
          fields: Object.keys(rows[0] || {}),
          analysisType,
          timestamp: new Date()
        },
        statistics: {},
        insights: []
      };
      
      // Calculate statistics for numeric fields
      const numericFields = analytics.summary.fields.filter(field => {
        return rows.some(row => !isNaN(Number(row[field])) && row[field] !== null);
      });
      
      numericFields.forEach(field => {
        const values = rows
          .map(row => Number(row[field]))
          .filter(val => !isNaN(val));
          
        if (values.length > 0) {
          analytics.statistics[field] = {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            average: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            median: this.calculateMedian(values)
          };
        }
      });
      
      // Generate insights
      if (rows.length > 1000) {
        analytics.insights.push('Large dataset detected - consider data sampling for performance');
      }
      
      numericFields.forEach(field => {
        const stats = analytics.statistics[field];
        if (stats && stats.max > stats.average * 3) {
          analytics.insights.push(`Field '${field}' has outliers that may need investigation`);
        }
      });
      
      return {
        success: true,
        analytics,
        recommendations: this.generateRecommendations(analytics)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }
  
  generateRecommendations(analytics) {
    const recommendations = [];
    
    if (analytics.summary.totalRecords < 100) {
      recommendations.push('Small dataset - consider collecting more data for better insights');
    }
    
    if (Object.keys(analytics.statistics).length === 0) {
      recommendations.push('No numeric fields found - consider data type conversions');
    }
    
    return recommendations;
  }
}

module.exports = DataAnalytics;
`);

    // Report Generator Extension
    await this.createExtension(extensionDir, 'report-generator', 'agent_capability', `
class ReportGenerator {
  constructor(config) {
    this.config = config;
    this.name = 'report-generator';
  }

  async onLoad(context) {
    this.logger = context.logger;
    this.logger.info('Report Generator extension loaded');
  }

  async generateReport(analytics, format = 'markdown') {
    try {
      let report = '';
      
      if (format === 'markdown') {
        report = this.generateMarkdownReport(analytics);
      } else if (format === 'json') {
        report = JSON.stringify(analytics, null, 2);
      } else {
        report = this.generateTextReport(analytics);
      }
      
      return {
        success: true,
        report,
        format,
        metadata: {
          generatedAt: new Date(),
          generator: 'report-generator-extension',
          size: report.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  generateMarkdownReport(analytics) {
    const { summary, statistics, insights, recommendations } = analytics;
    
    let report = `# Data Analysis Report

## Summary
- **Total Records**: ${summary.totalRecords}
- **Fields**: ${summary.fields.join(', ')}
- **Analysis Type**: ${summary.analysisType}
- **Generated**: ${summary.timestamp}

## Statistics
`;

    Object.entries(statistics).forEach(([field, stats]) => {
      report += `
### ${field}
- Count: ${stats.count}
- Average: ${stats.average.toFixed(2)}
- Min/Max: ${stats.min} / ${stats.max}
- Median: ${stats.median}
`;
    });

    if (insights.length > 0) {
      report += `
## Insights
${insights.map(insight => `- ${insight}`).join('\\n')}
`;
    }

    if (recommendations && recommendations.length > 0) {
      report += `
## Recommendations
${recommendations.map(rec => `- ${rec}`).join('\\n')}
`;
    }

    return report;
  }
  
  generateTextReport(analytics) {
    return `Data Analysis Report
Generated: ${analytics.summary.timestamp}
Total Records: ${analytics.summary.totalRecords}
Fields: ${analytics.summary.fields.join(', ')}

Statistics:
${Object.entries(analytics.statistics).map(([field, stats]) => 
  `${field}: avg=${stats.average.toFixed(2)}, min=${stats.min}, max=${stats.max}`
).join('\\n')}
`;
  }
}

module.exports = ReportGenerator;
`);

    this.logger.info('Data processing extensions created successfully');
  }

  /**
   * Register specialized agents for the pipeline
   */
  private async registerSpecializedAgents(): Promise<void> {
    // Data Ingestion Agent
    const dataIngestionAgent = await this.agentRegistry.registerAgent({
      name: 'DataIngestionAgent',
      type: 'DATA_INGESTION',
      capabilities: {
        fileProcessing: true,
        dataValidation: true,
        csvParsing: true,
        dataTransformation: true
      },
      configuration: {
        maxConcurrentTasks: 3,
        timeoutMs: 120000, // 2 minutes
        retryAttempts: 2
      },
      metadata: {
        specialization: 'data_ingestion',
        pipeline_role: 'input_processor'
      }
    });

    // Data Analysis Agent
    const dataAnalysisAgent = await this.agentRegistry.registerAgent({
      name: 'DataAnalysisAgent',
      type: 'DATA_ANALYST',
      capabilities: {
        statisticalAnalysis: true,
        dataVisualization: true,
        patternRecognition: true,
        insightGeneration: true
      },
      configuration: {
        maxConcurrentTasks: 2,
        timeoutMs: 300000, // 5 minutes
        retryAttempts: 1
      },
      metadata: {
        specialization: 'data_analysis',
        pipeline_role: 'analyzer'
      }
    });

    // Report Generation Agent
    const reportGenerationAgent = await this.agentRegistry.registerAgent({
      name: 'ReportGenerationAgent',
      type: 'REPORT_GENERATOR',
      capabilities: {
        reportGeneration: true,
        documentFormatting: true,
        chartCreation: true,
        dataExport: true
      },
      configuration: {
        maxConcurrentTasks: 2,
        timeoutMs: 180000, // 3 minutes
        retryAttempts: 2
      },
      metadata: {
        specialization: 'report_generation',
        pipeline_role: 'output_processor'
      }
    });

    // Quality Assurance Agent
    const qaAgent = await this.agentRegistry.registerAgent({
      name: 'QualityAssuranceAgent',
      type: 'QA_SPECIALIST',
      capabilities: {
        qualityControl: true,
        dataValidation: true,
        errorDetection: true,
        processMonitoring: true
      },
      configuration: {
        maxConcurrentTasks: 5,
        timeoutMs: 60000, // 1 minute
        retryAttempts: 1
      },
      metadata: {
        specialization: 'quality_assurance',
        pipeline_role: 'monitor'
      }
    });

    this.logger.info('Specialized agents registered successfully');
  }

  /**
   * Create the main data processing workflow
   */
  private async createDataProcessingWorkflow(): Promise<string> {
    // Get registered agents
    const agents = await this.agentRegistry.getAllAgents();
    const dataIngestionAgent = agents.find(a => a.type === 'DATA_INGESTION');
    const dataAnalysisAgent = agents.find(a => a.type === 'DATA_ANALYST');
    const reportGenerationAgent = agents.find(a => a.type === 'REPORT_GENERATOR');
    const qaAgent = agents.find(a => a.type === 'QA_SPECIALIST');

    // Create comprehensive data processing workflow
    const workflow = this.workflowEngine.builder.createWorkflow(
      'Comprehensive Data Processing Pipeline',
      'End-to-end data processing from CSV ingestion to report generation with quality assurance'
    );

    // Add workflow nodes
    const startNode = this.workflowEngine.builder.addNode('start', 'Pipeline Start', { x: 50, y: 150 });
    
    // Quality monitoring task (runs throughout)
    const qaMonitoringTask = this.workflowEngine.builder.addNode(
      WorkflowNodeType.AGENT_TASK,
      'Quality Monitoring',
      { x: 100, y: 50 },
      {
        agentId: qaAgent.agentId,
        task: 'Monitor pipeline quality and detect issues',
        priority: 'high',
        expectedDuration: 30,
        continuous: true
      }
    );

    // CSV parsing node
    const csvParsingNode = this.workflowEngine.builder.addNode(
      'csv-parser',
      'Parse CSV Data',
      { x: 200, y: 150 },
      {
        parseHeaders: true,
        trimWhitespace: true,
        skipEmptyLines: true
      }
    );

    // Data ingestion task
    const dataIngestionTask = this.workflowEngine.builder.addNode(
      WorkflowNodeType.AGENT_TASK,
      'Data Ingestion & Validation',
      { x: 350, y: 150 },
      {
        agentId: dataIngestionAgent.agentId,
        task: 'Ingest and validate parsed CSV data',
        priority: 'high',
        expectedDuration: 15,
        requiredExtensions: ['data-validator']
      }
    );

    // Data quality check
    const qualityCheckTask = this.workflowEngine.builder.addNode(
      WorkflowNodeType.AGENT_TASK,
      'Data Quality Check',
      { x: 500, y: 100 },
      {
        agentId: qaAgent.agentId,
        task: 'Perform comprehensive data quality assessment',
        priority: 'medium',
        expectedDuration: 10
      }
    );

    // Data analytics node
    const analyticsNode = this.workflowEngine.builder.addNode(
      'data-analytics',
      'Statistical Analysis',
      { x: 650, y: 150 },
      {
        analysisType: 'comprehensive',
        includeOutlierDetection: true,
        generateInsights: true
      }
    );

    // Analysis enhancement task
    const analysisEnhancementTask = this.workflowEngine.builder.addNode(
      WorkflowNodeType.AGENT_TASK,
      'Analysis Enhancement',
      { x: 800, y: 150 },
      {
        agentId: dataAnalysisAgent.agentId,
        task: 'Enhance analytics with domain expertise and additional insights',
        priority: 'medium',
        expectedDuration: 20
      }
    );

    // Report generation task
    const reportGenerationTask = this.workflowEngine.builder.addNode(
      WorkflowNodeType.AGENT_TASK,
      'Report Generation',
      { x: 950, y: 150 },
      {
        agentId: reportGenerationAgent.agentId,
        task: 'Generate comprehensive analysis report',
        priority: 'medium',
        expectedDuration: 15,
        requiredExtensions: ['report-generator']
      }
    );

    // Final quality check
    const finalQualityCheck = this.workflowEngine.builder.addNode(
      WorkflowNodeType.AGENT_TASK,
      'Final Quality Check',
      { x: 1100, y: 150 },
      {
        agentId: qaAgent.agentId,
        task: 'Final quality assessment of generated report',
        priority: 'low',
        expectedDuration: 5
      }
    );

    const endNode = this.workflowEngine.builder.addNode('end', 'Pipeline Complete', { x: 1200, y: 150 });

    // Connect the pipeline
    this.workflowEngine.builder.addConnection(startNode.id, 'output', qaMonitoringTask.id, 'task');
    this.workflowEngine.builder.addConnection(startNode.id, 'output', csvParsingNode.id, 'input');
    this.workflowEngine.builder.addConnection(csvParsingNode.id, 'success', dataIngestionTask.id, 'task');
    this.workflowEngine.builder.addConnection(dataIngestionTask.id, 'result', qualityCheckTask.id, 'task');
    this.workflowEngine.builder.addConnection(qualityCheckTask.id, 'approved', analyticsNode.id, 'input');
    this.workflowEngine.builder.addConnection(analyticsNode.id, 'success', analysisEnhancementTask.id, 'task');
    this.workflowEngine.builder.addConnection(analysisEnhancementTask.id, 'result', reportGenerationTask.id, 'task');
    this.workflowEngine.builder.addConnection(reportGenerationTask.id, 'result', finalQualityCheck.id, 'task');
    this.workflowEngine.builder.addConnection(finalQualityCheck.id, 'approved', endNode.id, 'input');

    // Add error handling connections
    this.workflowEngine.builder.addConnection(csvParsingNode.id, 'error', endNode.id, 'input');
    this.workflowEngine.builder.addConnection(qualityCheckTask.id, 'rejected', endNode.id, 'input');

    // Save workflow
    const savedWorkflow = await this.workflowEngine.repository.createWorkflow(workflow);
    
    this.logger.info(`Data processing workflow created with ID: ${savedWorkflow.id}`);
    return savedWorkflow.id;
  }

  /**
   * Process sample data through the pipeline
   */
  async processSampleData(): Promise<void> {
    this.logger.info('Processing sample data through the pipeline...');

    // Create sample CSV data
    const sampleCSV = `name,age,email,salary,department
John Doe,30,john.doe@company.com,50000,Engineering
Jane Smith,25,jane.smith@company.com,55000,Marketing
Bob Johnson,35,bob.johnson@company.com,60000,Engineering
Alice Brown,28,alice.brown@company.com,52000,Sales
Charlie Wilson,32,charlie.wilson@company.com,58000,Engineering
Diana Davis,29,diana.davis@company.com,54000,Marketing
Eve Miller,27,eve.miller@company.com,51000,Sales
Frank Garcia,33,frank.garcia@company.com,59000,Engineering
Grace Lee,26,grace.lee@company.com,53000,Marketing
Henry Taylor,31,henry.taylor@company.com,57000,Sales`;

    // Get the workflow
    const workflows = await this.workflowEngine.repository.getAllWorkflows();
    const dataWorkflow = workflows.find(w => w.name.includes('Comprehensive Data Processing'));

    if (!dataWorkflow) {
      throw new Error('Data processing workflow not found');
    }

    // Execute the pipeline
    const executionId = await this.workflowEngine.engine.executeWorkflow(
      dataWorkflow.id,
      {
        csvData: sampleCSV,
        processingOptions: {
          validationRules: {
            required: ['name', 'email'],
            types: {
              age: 'number',
              salary: 'number',
              email: 'email'
            }
          },
          reportFormat: 'markdown',
          includeDetailedAnalytics: true
        },
        metadata: {
          source: 'sample_data',
          requestId: 'pipeline_demo_001',
          timestamp: new Date()
        }
      }
    );

    this.logger.info(`Pipeline execution started with ID: ${executionId}`);

    // Monitor execution progress
    let execution = await this.workflowEngine.engine.getExecutionStatus(executionId);
    let lastStatus = execution?.status;

    const progressInterval = setInterval(async () => {
      execution = await this.workflowEngine.engine.getExecutionStatus(executionId);
      
      if (execution?.status !== lastStatus) {
        this.logger.info(`Pipeline status changed: ${lastStatus} -> ${execution?.status}`);
        lastStatus = execution?.status;
      }

      if (execution?.status === 'COMPLETED' || execution?.status === 'FAILED') {
        clearInterval(progressInterval);
        
        if (execution?.status === 'COMPLETED') {
          this.logger.info('Pipeline completed successfully!');
          this.logger.info(`Execution results: ${JSON.stringify(execution.result, null, 2)}`);
        } else {
          this.logger.error(`Pipeline failed: ${execution?.error}`);
        }
      }
    }, 2000);

    // Wait for completion (with timeout)
    const timeout = setTimeout(() => {
      clearInterval(progressInterval);
      this.logger.warn('Pipeline execution timeout reached');
    }, 300000); // 5 minutes

    // Keep the process alive until completion
    return new Promise((resolve) => {
      const checkCompletion = setInterval(async () => {
        execution = await this.workflowEngine.engine.getExecutionStatus(executionId);
        
        if (execution?.status === 'COMPLETED' || execution?.status === 'FAILED') {
          clearInterval(checkCompletion);
          clearTimeout(timeout);
          resolve();
        }
      }, 1000);
    });
  }

  /**
   * Display system statistics
   */
  async displaySystemStats(): Promise<void> {
    this.logger.info('=== SYSTEM STATISTICS ===');

    // Agent Registry Stats
    const systemHealth = await this.agentRegistry.getSystemHealth();
    this.logger.info(`Active Agents: ${systemHealth.activeAgents}`);
    this.logger.info(`System Status: ${systemHealth.status}`);

    // Extension Stats
    const extensionStats = this.extensionManager.getExtensionStats();
    this.logger.info(`Total Extensions: ${extensionStats.totalExtensions}`);
    this.logger.info(`Active Extensions: ${extensionStats.activeExtensions}`);

    // Workflow Stats
    const workflows = await this.workflowEngine.repository.getAllWorkflows();
    this.logger.info(`Total Workflows: ${workflows.length}`);

    // Agent details
    const agents = await this.agentRegistry.getAllAgents();
    this.logger.info('\\nAgent Details:');
    agents.forEach(agent => {
      this.logger.info(`  - ${agent.name} (${agent.type}): ${agent.status}`);
    });

    this.logger.info('=== END STATISTICS ===');
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Data Pipeline Application...');

    if (this.extensionManager) {
      await this.extensionManager.shutdown();
    }

    if (this.heartbeatService) {
      await this.heartbeatService.shutdown();
    }

    if (this.agentRegistry) {
      await this.agentRegistry.shutdown();
    }

    if (this.drizzle) {
      await this.drizzle.$disconnect();
    }

    this.logger.info('Data Pipeline Application shut down successfully');
  }

  /**
   * Helper method to create extensions
   */
  private async createExtension(baseDir: string, name: string, type: string, content: string): Promise<void> {
    const extensionDir = path.join(baseDir, name);
    await fs.ensureDir(extensionDir);

    // Create manifest
    const manifest = {
      name: `@data-pipeline/${name}`,
      version: '1.0.0',
      description: `Data pipeline extension: ${name}`,
      type,
      category: 'data-processing',
      main: 'index.js',
      author: 'Data Pipeline App',
      keywords: ['data', 'processing', 'pipeline'],
      permissions: ['filesystem_read', 'agent_control']
    };

    await fs.writeJson(path.join(extensionDir, 'extension.json'), manifest, { spaces: 2 });
    await fs.writeFile(path.join(extensionDir, 'index.js'), content);
  }
}

/**
 * Main execution function
 */
export async function runDataPipelineExample(): Promise<void> {
  const app = new DataPipelineApp();

  try {
    // Initialize the application
    await app.initialize();

    // Setup the pipeline
    await app.setupPipeline();

    // Process sample data
    await app.processSampleData();

    // Display statistics
    await app.displaySystemStats();

  } catch (error) {
    console.error('Data Pipeline Application error:', error);
  } finally {
    // Cleanup
    await app.shutdown();
  }
}

// If running directly
if (require.main === module) {
  runDataPipelineExample().catch(() => {});
}