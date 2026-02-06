/**
 * Multi-Agent Collaboration Example Application
 *
 * Demonstrates advanced multi-agent collaboration using the unified framework
 * for a software development project scenario with multiple specialized agents
 */

import { HeartbeatMonitoringService, Logger, MasterAgentRegistry } from '@the-new-fuse/relay-core';
// import { WorkflowEngineFactory } from '@the-new-fuse/workflow-engine'; // Removed workflow-engine dependency
import { ExtensionSystemFactory } from '@the-new-fuse/extension-system';
// import { WorkflowNodeType } from '@the-new-fuse/workflow-engine/types'; // Removed workflow-engine dependency
import { DatabaseService } from '@db/client';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Multi-Agent Collaboration Application
 *
 * Simulates a software development team with specialized agents:
 * - Project Manager: Coordinates tasks and timelines
 * - Frontend Developer: Handles UI/UX development
 * - Backend Developer: Manages server-side logic
 * - QA Tester: Tests and validates functionality
 * - DevOps Engineer: Handles deployment and infrastructure
 */
export class CollaborationApp {
  private logger: Logger;
  private db: DatabaseService;
  private agentRegistry: MasterAgentRegistry;
  private heartbeatService: HeartbeatMonitoringService;
  private workflowEngine: any;
  private extensionManager: any;

  // Agent IDs for easy reference
  private agentIds: { [role: string]: string } = {};

  constructor() {
    this.logger = new Logger({
      level: 'info',
      silent: false,
    });
  }

  /**
   * Initialize the collaboration application
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Multi-Agent Collaboration Application...');

    // Setup database
    this.db = new DatabaseService({
      datasources: {
        db: {
          url: 'file:./collaboration.db',
        },
      },
    });

    // Setup Master Agent Registry with collaboration focus
    const agentConfig = {
      enableMerkleTree: true,
      enableSpreadsheetIntegration: false,
      enableHeartbeatMonitoring: true,
      onboardingRequired: true,
      protocolComplianceRequired: true,
      redisConnection: null,
      maxAgents: 20,
      stagnationThresholdMs: 180000, // 3 minutes
      cleanupIntervalMs: 30000, // 30 seconds
      collaborationMode: true,
    };

    this.agentRegistry = new MasterAgentRegistry(agentConfig, this.db, this.logger);

    // Setup Heartbeat Monitoring for team coordination
    const heartbeatConfig = {
      checkIntervalMs: 5000, // 5 seconds for responsive collaboration
      stagnationThresholdMs: 180000, // 3 minutes
      maxMissedHeartbeats: 2,
      enableAutoRemediation: true,
    };

    this.heartbeatService = new HeartbeatMonitoringService(
      heartbeatConfig,
      this.agentRegistry,
      this.logger
    );

    // Setup Workflow Engine
    this.workflowEngine = WorkflowEngineFactory.createDefault(
      this.db,
      this.agentRegistry,
      this.heartbeatService,
      this.logger
    );

    // Setup Extension System for collaboration tools
    const extensionDir = path.join(__dirname, '../examples/collaboration-extensions');
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

    this.logger.info('Multi-Agent Collaboration Application initialized successfully');
  }

  /**
   * Setup collaboration environment
   */
  async setupCollaboration(): Promise<void> {
    this.logger.info('Setting up collaboration environment...');

    // Create collaboration extensions
    await this.createCollaborationExtensions();

    // Register development team agents
    await this.registerDevelopmentTeam();

    // Create project workflows
    await this.createProjectWorkflows();

    this.logger.info('Collaboration environment setup complete');
  }

  /**
   * Create collaboration-focused extensions
   */
  private async createCollaborationExtensions(): Promise<void> {
    const extensionDir = path.join(__dirname, '../examples/collaboration-extensions');

    // Task Coordinator Extension
    const taskCoordinatorContent = await fs.readFile(
      path.join(extensionDir, 'task-coordinator.js'),
      'utf-8'
    );
    await this.createExtension(
      extensionDir,
      'task-coordinator',
      'agent_capability',
      taskCoordinatorContent
    );

    // Communication Hub Extension
    const communicationHubContent = await fs.readFile(
      path.join(extensionDir, 'communication-hub.js'),
      'utf-8'
    );
    await this.createExtension(
      extensionDir,
      'communication-hub',
      'workflow_node',
      communicationHubContent
    );

    // Progress Tracker Extension
    const progressTrackerContent = await fs.readFile(
      path.join(extensionDir, 'progress-tracker.js'),
      'utf-8'
    );
    await this.createExtension(
      extensionDir,
      'progress-tracker',
      'agent_capability',
      progressTrackerContent
    );

    this.logger.info('Collaboration extensions created successfully');
  }

  /**
   * Register development team agents
   */
  private async registerDevelopmentTeam(): Promise<void> {
    // Project Manager
    const pmResult = await this.agentRegistry.registerAgent({
      name: 'ProjectManager',
      type: 'PROJECT_MANAGER',
      capabilities: {
        projectPlanning: true,
        taskCoordination: true,
        teamManagement: true,
        statusReporting: true,
        riskAssessment: true,
      },
      configuration: {
        maxConcurrentTasks: 10,
        timeoutMs: 600000, // 10 minutes
        retryAttempts: 2,
      },
      metadata: {
        specialization: 'project_management',
        teamRole: 'coordinator',
        yearsExperience: 8,
      },
    });
    this.agentIds.projectManager = pmResult.agentId;

    // Frontend Developer
    const frontendResult = await this.agentRegistry.registerAgent({
      name: 'FrontendDeveloper',
      type: 'FRONTEND_DEVELOPER',
      capabilities: {
        reactDevelopment: true,
        uiDesign: true,
        responsiveDesign: true,
        frontendTesting: true,
        apiIntegration: true,
      },
      configuration: {
        maxConcurrentTasks: 3,
        timeoutMs: 480000, // 8 minutes
        retryAttempts: 2,
      },
      metadata: {
        specialization: 'frontend_development',
        teamRole: 'developer',
        technologies: ['React', 'TypeScript', 'CSS', 'Jest'],
      },
    });
    this.agentIds.frontendDeveloper = frontendResult.agentId;

    // Backend Developer
    const backendResult = await this.agentRegistry.registerAgent({
      name: 'BackendDeveloper',
      type: 'BACKEND_DEVELOPER',
      capabilities: {
        apiDevelopment: true,
        databaseDesign: true,
        serverManagement: true,
        microservices: true,
        securityImplementation: true,
      },
      configuration: {
        maxConcurrentTasks: 4,
        timeoutMs: 600000, // 10 minutes
        retryAttempts: 2,
      },
      metadata: {
        specialization: 'backend_development',
        teamRole: 'developer',
        technologies: ['Node.js', 'PostgreSQL', 'Redis', 'Docker'],
      },
    });
    this.agentIds.backendDeveloper = backendResult.agentId;

    // QA Tester
    const qaResult = await this.agentRegistry.registerAgent({
      name: 'QATester',
      type: 'QA_TESTER',
      capabilities: {
        functionalTesting: true,
        automatedTesting: true,
        performanceTesting: true,
        bugReporting: true,
        testPlanCreation: true,
      },
      configuration: {
        maxConcurrentTasks: 5,
        timeoutMs: 360000, // 6 minutes
        retryAttempts: 1,
      },
      metadata: {
        specialization: 'quality_assurance',
        teamRole: 'tester',
        testingFrameworks: ['Jest', 'Cypress', 'Selenium'],
      },
    });
    this.agentIds.qaTester = qaResult.agentId;

    // DevOps Engineer
    const devopsResult = await this.agentRegistry.registerAgent({
      name: 'DevOpsEngineer',
      type: 'DEVOPS_ENGINEER',
      capabilities: {
        cicdPipelines: true,
        containerization: true,
        cloudDeployment: true,
        monitoring: true,
        infrastructureAsCode: true,
      },
      configuration: {
        maxConcurrentTasks: 6,
        timeoutMs: 900000, // 15 minutes
        retryAttempts: 3,
      },
      metadata: {
        specialization: 'devops',
        teamRole: 'infrastructure',
        platforms: ['AWS', 'Docker', 'Kubernetes', 'GitHub Actions'],
      },
    });
    this.agentIds.devopsEngineer = devopsResult.agentId;

    this.logger.info('Development team agents registered successfully');
  }

  /**
   * Create project workflows
   */
  private async createProjectWorkflows(): Promise<string> {
    // Feature Development Workflow
    const workflow = this.workflowEngine.builder.createWorkflow(
      'Feature Development Workflow',
      'Collaborative workflow for developing new features with full team coordination'
    );

    // Add workflow nodes
    const startNode = this.workflowEngine.builder.addNode('start', 'Project Start', {
      x: 50,
      y: 200,
    });

    // Project planning and task coordination
    const projectPlanningTask = this.workflowEngine.builder.addNode(
      WorkflowNodeType.AGENT_TASK,
      'Project Planning',
      { x: 150, y: 200 },
      {
        agentId: this.agentIds.projectManager,
        task: 'Plan project phases, estimate timelines, and coordinate team assignments',
        priority: 'critical',
        expectedDuration: 30,
        requiredExtensions: ['task-coordinator', 'progress-tracker'],
      }
    );

    // Communication setup
    const communicationSetup = this.workflowEngine.builder.addNode(
      'communication-hub',
      'Setup Team Communication',
      { x: 300, y: 150 },
      {
        action: 'create_channel',
        data: {
          name: 'feature-development',
          description: 'Channel for feature development coordination',
          type: 'project',
        },
      }
    );

    // Parallel development tasks
    const backendTask = this.workflowEngine.builder.addNode(
      WorkflowNodeType.AGENT_TASK,
      'Backend Development',
      { x: 450, y: 100 },
      {
        agentId: this.agentIds.backendDeveloper,
        task: 'Develop backend APIs and database schema',
        priority: 'high',
        expectedDuration: 120,
        requiredExtensions: ['progress-tracker'],
      }
    );

    const frontendTask = this.workflowEngine.builder.addNode(
      WorkflowNodeType.AGENT_TASK,
      'Frontend Development',
      { x: 450, y: 250 },
      {
        agentId: this.agentIds.frontendDeveloper,
        task: 'Develop user interface and integrate with backend',
        priority: 'high',
        expectedDuration: 100,
        requiredExtensions: ['progress-tracker'],
      }
    );

    // Team coordination node
    const teamCoordination = this.workflowEngine.builder.addNode(
      WorkflowNodeType.AGENT_COORDINATION,
      'Development Coordination',
      { x: 600, y: 175 },
      {
        coordinationType: 'synchronization',
        agentIds: [this.agentIds.backendDeveloper, this.agentIds.frontendDeveloper],
        task: 'Coordinate development progress and resolve integration issues',
        syncPoints: ['api_design', 'integration_testing'],
      }
    );

    // Quality assurance
    const qaTask = this.workflowEngine.builder.addNode(
      WorkflowNodeType.AGENT_TASK,
      'Quality Assurance',
      { x: 750, y: 175 },
      {
        agentId: this.agentIds.qaTester,
        task: 'Perform comprehensive testing and validate functionality',
        priority: 'high',
        expectedDuration: 60,
        requiredExtensions: ['progress-tracker'],
      }
    );

    // DevOps deployment preparation
    const deploymentPrepTask = this.workflowEngine.builder.addNode(
      WorkflowNodeType.AGENT_TASK,
      'Deployment Preparation',
      { x: 900, y: 175 },
      {
        agentId: this.agentIds.devopsEngineer,
        task: 'Prepare deployment pipeline and infrastructure',
        priority: 'medium',
        expectedDuration: 45,
        requiredExtensions: ['progress-tracker'],
      }
    );

    // Final project review
    const projectReviewTask = this.workflowEngine.builder.addNode(
      WorkflowNodeType.AGENT_TASK,
      'Project Review',
      { x: 1050, y: 175 },
      {
        agentId: this.agentIds.projectManager,
        task: 'Conduct final project review and generate completion report',
        priority: 'medium',
        expectedDuration: 20,
        requiredExtensions: ['task-coordinator', 'progress-tracker'],
      }
    );

    const endNode = this.workflowEngine.builder.addNode('end', 'Project Complete', {
      x: 1150,
      y: 175,
    });

    // Connect the workflow
    this.workflowEngine.builder.addConnection(
      startNode.id,
      'output',
      projectPlanningTask.id,
      'task'
    );
    this.workflowEngine.builder.addConnection(
      projectPlanningTask.id,
      'result',
      communicationSetup.id,
      'input'
    );
    this.workflowEngine.builder.addConnection(
      communicationSetup.id,
      'success',
      backendTask.id,
      'task'
    );
    this.workflowEngine.builder.addConnection(
      communicationSetup.id,
      'success',
      frontendTask.id,
      'task'
    );
    this.workflowEngine.builder.addConnection(
      backendTask.id,
      'result',
      teamCoordination.id,
      'agents'
    );
    this.workflowEngine.builder.addConnection(
      frontendTask.id,
      'result',
      teamCoordination.id,
      'agents'
    );
    this.workflowEngine.builder.addConnection(
      teamCoordination.id,
      'synchronized',
      qaTask.id,
      'task'
    );
    this.workflowEngine.builder.addConnection(qaTask.id, 'approved', deploymentPrepTask.id, 'task');
    this.workflowEngine.builder.addConnection(
      deploymentPrepTask.id,
      'result',
      projectReviewTask.id,
      'task'
    );
    this.workflowEngine.builder.addConnection(projectReviewTask.id, 'result', endNode.id, 'input');

    // Save workflow
    const savedWorkflow = await this.workflowEngine.repository.createWorkflow(workflow);

    this.logger.info(`Feature development workflow created with ID: ${savedWorkflow.id}`);
    return savedWorkflow.id;
  }

  /**
   * Execute a collaborative project
   */
  async executeCollaborativeProject(): Promise<void> {
    this.logger.info('Starting collaborative project execution...');

    // Get the feature development workflow
    const workflows = await this.workflowEngine.repository.getAllWorkflows();
    const featureWorkflow = workflows.find((w) => w.name.includes('Feature Development'));

    if (!featureWorkflow) {
      throw new Error('Feature development workflow not found');
    }

    // Define the project
    const projectSpec = {
      name: 'User Dashboard Enhancement',
      description: 'Enhance the user dashboard with real-time analytics and improved UX',
      requirements: [
        'Real-time data visualization',
        'Responsive design for mobile devices',
        'User preference customization',
        'Performance optimization',
        'Accessibility compliance',
      ],
      priority: 'high',
      estimatedDuration: 240, // 4 hours total
      budget: 50000,
      stakeholders: ['Product Manager', 'UX Designer', 'Customer Support'],
      technicalConstraints: {
        framework: 'React 18',
        backend: 'Node.js with Express',
        database: 'PostgreSQL',
        deployment: 'AWS ECS',
      },
    };

    // Execute the collaborative workflow
    const executionId = await this.workflowEngine.engine.executeWorkflow(featureWorkflow.id, {
      project: projectSpec,
      teamConfiguration: {
        projectManager: this.agentIds.projectManager,
        frontendDeveloper: this.agentIds.frontendDeveloper,
        backendDeveloper: this.agentIds.backendDeveloper,
        qaTester: this.agentIds.qaTester,
        devopsEngineer: this.agentIds.devopsEngineer,
      },
      collaborationSettings: {
        communicationFrequency: 'high',
        progressReportingInterval: 15, // 15 minutes
        autoSyncEnabled: true,
        conflictResolutionStrategy: 'escalate_to_pm',
      },
      metadata: {
        requestId: 'collab_project_001',
        initiatedBy: 'system',
        timestamp: new Date(),
      },
    });

    this.logger.info(`Collaborative project execution started with ID: ${executionId}`);

    // Monitor collaboration progress
    await this.monitorCollaboration(executionId);
  }

  /**
   * Monitor collaboration progress
   */
  private async monitorCollaboration(executionId: string): Promise<void> {
    let execution = await this.workflowEngine.engine.getExecutionStatus(executionId);
    let lastStatus = execution?.status;
    let progressCheckCount = 0;

    const monitoringInterval = setInterval(async () => {
      try {
        execution = await this.workflowEngine.engine.getExecutionStatus(executionId);
        progressCheckCount++;

        // Log status changes
        if (execution?.status !== lastStatus) {
          this.logger.info(`Collaboration status: ${lastStatus} -> ${execution?.status}`);
          lastStatus = execution?.status;
        }

        // Log team progress every 5 checks
        if (progressCheckCount % 5 === 0) {
          await this.logTeamProgress();
        }

        // Stop monitoring when complete
        if (execution?.status === 'COMPLETED' || execution?.status === 'FAILED') {
          clearInterval(monitoringInterval);

          if (execution?.status === 'COMPLETED') {
            this.logger.info('Collaborative project completed successfully!');
            await this.generateCollaborationReport(executionId);
          } else {
            this.logger.error(`Collaborative project failed: ${execution?.error}`);
          }
        }
      } catch (error) {
        this.logger.error(`Error monitoring collaboration: ${error.message}`);
      }
    }, 3000); // Check every 3 seconds

    // Timeout after 30 minutes
    setTimeout(() => {
      clearInterval(monitoringInterval);
      this.logger.warn('Collaboration monitoring timeout reached');
    }, 1800000);
  }

  /**
   * Log team progress
   */
  private async logTeamProgress(): Promise<void> {
    this.logger.info('=== TEAM PROGRESS UPDATE ===');

    for (const [role, agentId] of Object.entries(this.agentIds)) {
      try {
        const profile = await this.agentRegistry.getAgentProfile(agentId);
        const activeTasks =
          profile.todoList?.filter((task) => task.status === 'in_progress').length || 0;
        const completedTasks = profile.completedTasks || 0;

        this.logger.info(`${role}: ${completedTasks} completed, ${activeTasks} active tasks`);
      } catch (error) {
        this.logger.warn(`Error getting progress for ${role}: ${error.message}`);
      }
    }

    this.logger.info('=== END PROGRESS UPDATE ===');
  }

  /**
   * Generate collaboration report
   */
  private async generateCollaborationReport(executionId: string): Promise<void> {
    const execution = await this.workflowEngine.engine.getExecutionStatus(executionId);

    const report = {
      project: {
        executionId,
        status: execution?.status,
        startTime: execution?.startTime,
        endTime: execution?.endTime,
        duration: execution?.endTime ? execution.endTime - execution.startTime : null,
      },
      teamPerformance: {},
      collaboration: {
        handoffs: 0,
        communications: 0,
        conflictsResolved: 0,
      },
      outcomes: {
        tasksCompleted: 0,
        qualityScore: 0,
        efficiency: 0,
      },
    };

    // Collect team performance data
    for (const [role, agentId] of Object.entries(this.agentIds)) {
      try {
        const profile = await this.agentRegistry.getAgentProfile(agentId);
        report.teamPerformance[role] = {
          agentId,
          completedTasks: profile.completedTasks || 0,
          handoffsInitiated: profile.handoffsInitiated || 0,
          handoffsReceived: profile.handoffsReceived || 0,
          collaborations: profile.collaborations || 0,
          averageTaskDuration: profile.averageTaskDuration || 0,
        };

        report.collaboration.handoffs += profile.handoffsInitiated || 0;
      } catch (error) {
        this.logger.warn(`Error collecting data for ${role}: ${error.message}`);
      }
    }

    // Calculate overall metrics
    const totalCompletedTasks = Object.values(report.teamPerformance).reduce(
      (sum: number, perf: any) => sum + perf.completedTasks,
      0
    );

    report.outcomes.tasksCompleted = totalCompletedTasks;
    report.outcomes.efficiency = execution?.duration
      ? totalCompletedTasks / (execution.duration / 60000)
      : 0;

    this.logger.info('=== COLLABORATION REPORT ===');
    this.logger.info(JSON.stringify(report, null, 2));
    this.logger.info('=== END COLLABORATION REPORT ===');
  }

  /**
   * Display system status
   */
  async displaySystemStatus(): Promise<void> {
    this.logger.info('=== COLLABORATION SYSTEM STATUS ===');

    // Agent status
    const agents = await this.agentRegistry.getAllAgents();
    this.logger.info(`Active Agents: ${agents.length}`);

    agents.forEach((agent) => {
      this.logger.info(`  - ${agent.name} (${agent.type}): ${agent.status}`);
    });

    // Extension status
    const extensionStats = this.extensionManager.getExtensionStats();
    this.logger.info(`Active Extensions: ${extensionStats.activeExtensions}`);

    // System health
    const systemHealth = await this.agentRegistry.getSystemHealth();
    this.logger.info(`System Health: ${systemHealth.status}`);

    this.logger.info('=== END SYSTEM STATUS ===');
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Collaboration Application...');

    if (this.extensionManager) {
      await this.extensionManager.shutdown();
    }

    if (this.heartbeatService) {
      await this.heartbeatService.shutdown();
    }

    if (this.agentRegistry) {
      await this.agentRegistry.shutdown();
    }

    if (this.db) {
      await this.db.$disconnect();
    }

    this.logger.info('Collaboration Application shut down successfully');
  }

  /**
   * Helper method to create extensions
   */
  private async createExtension(
    baseDir: string,
    name: string,
    type: string,
    content: string
  ): Promise<void> {
    const extensionDir = path.join(baseDir, name);
    await fs.ensureDir(extensionDir);

    const manifest = {
      name: `@collaboration/${name}`,
      version: '1.0.0',
      description: `Collaboration extension: ${name}`,
      type,
      category: 'collaboration',
      main: 'index.js',
      author: 'Collaboration App',
      keywords: ['collaboration', 'teamwork', 'coordination'],
      permissions: ['agent_control', 'workflow_modify'],
    };

    await fs.writeJson(path.join(extensionDir, 'extension.json'), manifest, { spaces: 2 });
    await fs.writeFile(path.join(extensionDir, 'index.js'), content);
  }
}

/**
 * Main execution function
 */
export async function runCollaborationExample(): Promise<void> {
  const app = new CollaborationApp();

  try {
    await app.initialize();
    await app.setupCollaboration();
    await app.executeCollaborativeProject();
    await app.displaySystemStatus();
  } catch (error) {
    console.error('Collaboration Application error:', error);
  } finally {
    await app.shutdown();
  }
}

// If running directly
if (require.main === module) {
  runCollaborationExample().catch(() => {});
}
