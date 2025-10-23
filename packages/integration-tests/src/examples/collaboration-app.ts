/**
 * Multi-Agent Collaboration Example Application
 * 
 * Demonstrates advanced multi-agent collaboration using the unified framework
 * for a software development project scenario with multiple specialized agents
 */

import { Logger, MasterAgentRegistry, HeartbeatMonitoringService } from '@tnf/relay-core';
// import { WorkflowEngineFactory } from '@the-new-fuse/workflow-engine'; // Removed workflow-engine dependency
import { ExtensionSystemFactory } from '@the-new-fuse/extension-system';
// import { WorkflowNodeType } from '@the-new-fuse/workflow-engine/types'; // Removed workflow-engine dependency
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs-extra';

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
  private prisma: PrismaClient;
  private agentRegistry: MasterAgentRegistry;
  private heartbeatService: HeartbeatMonitoringService;
  private workflowEngine: any;
  private extensionManager: any;

  // Agent IDs for easy reference
  private agentIds: { [role: string]: string } = {};

  constructor() {
    this.logger = new Logger({
      level: 'info',
      silent: false
    });
  }

  /**
   * Initialize the collaboration application
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Multi-Agent Collaboration Application...');

    // Setup database
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'file:./collaboration.db'
        }
      }
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
      collaborationMode: true
    };

    this.agentRegistry = new MasterAgentRegistry(agentConfig, this.prisma, this.logger);

    // Setup Heartbeat Monitoring for team coordination
    const heartbeatConfig = {
      checkIntervalMs: 5000, // 5 seconds for responsive collaboration
      stagnationThresholdMs: 180000, // 3 minutes
      maxMissedHeartbeats: 2,
      enableAutoRemediation: true
    };

    this.heartbeatService = new HeartbeatMonitoringService(heartbeatConfig, this.agentRegistry, this.logger);

    // Setup Workflow Engine
    this.workflowEngine = WorkflowEngineFactory.createDefault(
      this.prisma,
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
    await this.createExtension(extensionDir, 'task-coordinator', 'agent_capability', `
class TaskCoordinator {
  constructor(config) {
    this.config = config;
    this.name = 'task-coordinator';
    this.activeTasks = new Map();
  }

  async onLoad(context) {
    this.logger = context.logger;
    this.agentRegistry = context.agentRegistry;
    this.logger.info('Task Coordinator extension loaded');
  }

  async coordinateTask(task, teamMembers = []) {
    const coordination = {
      taskId: \`task_\${Date.now()}\`,
      task,
      assignedTo: null,
      status: 'pending',
      priority: task.priority || 'medium',
      estimatedDuration: task.estimatedDuration || 60,
      dependencies: task.dependencies || [],
      teamMembers,
      createdAt: new Date(),
      updates: []
    };

    // Find best agent for task based on capabilities
    const bestAgent = await this.findBestAgent(task, teamMembers);
    if (bestAgent) {
      coordination.assignedTo = bestAgent.agentId;
      coordination.status = 'assigned';
      coordination.updates.push({
        timestamp: new Date(),
        type: 'assignment',
        message: \`Task assigned to \${bestAgent.name}\`
      });
    }

    this.activeTasks.set(coordination.taskId, coordination);
    
    return {
      success: true,
      coordination,
      message: \`Task coordinated and assigned to \${bestAgent?.name || 'queue'}\`
    };
  }

  async updateTaskStatus(taskId, status, progress = null, notes = null) {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    task.status = status;
    task.updates.push({
      timestamp: new Date(),
      type: 'status_update',
      status,
      progress,
      notes
    });

    if (status === 'completed') {
      task.completedAt = new Date();
      task.actualDuration = task.completedAt - task.createdAt;
    }

    return {
      success: true,
      task,
      message: \`Task \${taskId} updated to \${status}\`
    };
  }

  async findBestAgent(task, teamMembers) {
    // Simple capability matching logic
    const requiredCapabilities = task.requiredCapabilities || [];
    let bestMatch = null;
    let bestScore = 0;

    for (const member of teamMembers) {
      try {
        const profile = await this.agentRegistry.getAgentProfile(member.agentId);
        if (!profile || profile.status !== 'ACTIVE') continue;

        let score = 0;
        
        // Check capability match
        requiredCapabilities.forEach(capability => {
          if (profile.capabilities[capability]) {
            score += 10;
          }
        });

        // Prefer agents with lower current workload
        const currentTasks = profile.todoList?.length || 0;
        score -= currentTasks * 2;

        // Bonus for matching specialization
        if (profile.metadata?.specialization === task.category) {
          score += 15;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = { agentId: member.agentId, name: profile.name, score };
        }
      } catch (error) {
        this.logger.warn(\`Error evaluating agent \${member.agentId}: \${error.message}\`);
      }
    }

    return bestMatch;
  }

  getActiveTasksReport() {
    const tasks = Array.from(this.activeTasks.values());
    return {
      totalTasks: tasks.length,
      byStatus: tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {}),
      tasks: tasks.map(task => ({
        taskId: task.taskId,
        status: task.status,
        assignedTo: task.assignedTo,
        priority: task.priority
      }))
    };
  }
}

module.exports = TaskCoordinator;
`);

    // Communication Hub Extension
    await this.createExtension(extensionDir, 'communication-hub', 'workflow_node', `
class CommunicationHub {
  constructor(config) {
    this.config = config;
    this.name = 'communication-hub';
    this.messages = [];
    this.channels = new Map();
  }

  async onLoad(context) {
    this.logger = context.logger;
    this.logger.info('Communication Hub extension loaded');
  }

  async execute(input) {
    const { action, data } = input;

    try {
      switch (action) {
        case 'send_message':
          return await this.sendMessage(data);
        case 'create_channel':
          return await this.createChannel(data);
        case 'broadcast':
          return await this.broadcast(data);
        case 'get_messages':
          return await this.getMessages(data);
        default:
          throw new Error(\`Unknown action: \${action}\`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendMessage(data) {
    const { from, to, channel, message, priority = 'normal' } = data;
    
    const messageObj = {
      id: \`msg_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
      from,
      to,
      channel,
      message,
      priority,
      timestamp: new Date(),
      status: 'sent'
    };

    this.messages.push(messageObj);

    // Add to channel if specified
    if (channel && this.channels.has(channel)) {
      const channelData = this.channels.get(channel);
      channelData.messages.push(messageObj.id);
    }

    return {
      success: true,
      messageId: messageObj.id,
      message: 'Message sent successfully'
    };
  }

  async createChannel(data) {
    const { name, description, members = [], type = 'team' } = data;
    
    const channel = {
      id: \`channel_\${Date.now()}\`,
      name,
      description,
      type,
      members,
      messages: [],
      createdAt: new Date(),
      active: true
    };

    this.channels.set(channel.id, channel);

    return {
      success: true,
      channelId: channel.id,
      channel
    };
  }

  async broadcast(data) {
    const { from, message, priority = 'normal', excludeAgents = [] } = data;
    
    const broadcastId = \`broadcast_\${Date.now()}\`;
    const recipients = data.recipients || 'all';

    const broadcastMessage = {
      id: broadcastId,
      type: 'broadcast',
      from,
      recipients,
      message,
      priority,
      timestamp: new Date(),
      excludeAgents
    };

    this.messages.push(broadcastMessage);

    return {
      success: true,
      broadcastId,
      message: 'Broadcast sent successfully'
    };
  }

  async getMessages(data) {
    const { agentId, channel, since, limit = 50 } = data;
    
    let filteredMessages = this.messages;

    if (agentId) {
      filteredMessages = filteredMessages.filter(msg => 
        msg.to === agentId || msg.from === agentId || 
        (msg.type === 'broadcast' && !msg.excludeAgents.includes(agentId))
      );
    }

    if (channel) {
      filteredMessages = filteredMessages.filter(msg => msg.channel === channel);
    }

    if (since) {
      const sinceDate = new Date(since);
      filteredMessages = filteredMessages.filter(msg => msg.timestamp > sinceDate);
    }

    return {
      success: true,
      messages: filteredMessages.slice(-limit),
      count: filteredMessages.length
    };
  }
}

module.exports = CommunicationHub;
`);

    // Progress Tracker Extension
    await this.createExtension(extensionDir, 'progress-tracker', 'agent_capability', `
class ProgressTracker {
  constructor(config) {
    this.config = config;
    this.name = 'progress-tracker';
    this.projects = new Map();
  }

  async onLoad(context) {
    this.logger = context.logger;
    this.logger.info('Progress Tracker extension loaded');
  }

  async trackProgress(projectId, task, progress) {
    if (!this.projects.has(projectId)) {
      this.projects.set(projectId, {
        id: projectId,
        name: \`Project \${projectId}\`,
        tasks: new Map(),
        overallProgress: 0,
        startDate: new Date(),
        lastUpdate: new Date()
      });
    }

    const project = this.projects.get(projectId);
    
    const taskProgress = {
      taskId: task.id || \`task_\${Date.now()}\`,
      name: task.name,
      assignedTo: task.assignedTo,
      progress: progress.percentage || 0,
      status: progress.status || 'in_progress',
      estimatedCompletion: progress.estimatedCompletion,
      actualHours: progress.actualHours || 0,
      estimatedHours: task.estimatedHours || 8,
      lastUpdate: new Date(),
      milestones: progress.milestones || [],
      issues: progress.issues || []
    };

    project.tasks.set(taskProgress.taskId, taskProgress);
    project.lastUpdate = new Date();

    // Calculate overall project progress
    const tasks = Array.from(project.tasks.values());
    project.overallProgress = tasks.reduce((total, task) => total + task.progress, 0) / tasks.length;

    return {
      success: true,
      project: {
        id: project.id,
        name: project.name,
        overallProgress: project.overallProgress,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length
      },
      task: taskProgress
    };
  }

  async generateReport(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const tasks = Array.from(project.tasks.values());
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    const blockedTasks = tasks.filter(t => t.status === 'blocked');

    const report = {
      project: {
        id: project.id,
        name: project.name,
        overallProgress: project.overallProgress,
        startDate: project.startDate,
        lastUpdate: project.lastUpdate
      },
      summary: {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        blockedTasks: blockedTasks.length,
        completionRate: (completedTasks.length / tasks.length) * 100
      },
      timeline: {
        totalEstimatedHours: tasks.reduce((total, task) => total + task.estimatedHours, 0),
        totalActualHours: tasks.reduce((total, task) => total + task.actualHours, 0),
        efficiency: this.calculateEfficiency(tasks)
      },
      issues: tasks.flatMap(task => task.issues),
      upcomingMilestones: this.getUpcomingMilestones(tasks)
    };

    return {
      success: true,
      report,
      generatedAt: new Date()
    };
  }

  calculateEfficiency(tasks) {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    if (completedTasks.length === 0) return 0;

    const totalEstimated = completedTasks.reduce((total, task) => total + task.estimatedHours, 0);
    const totalActual = completedTasks.reduce((total, task) => total + task.actualHours, 0);

    return totalEstimated > 0 ? (totalEstimated / totalActual) * 100 : 0;
  }

  getUpcomingMilestones(tasks) {
    const allMilestones = tasks.flatMap(task => 
      task.milestones.map(milestone => ({
        ...milestone,
        taskId: task.taskId,
        taskName: task.name
      }))
    );

    return allMilestones
      .filter(milestone => new Date(milestone.dueDate) > new Date())
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 10);
  }
}

module.exports = ProgressTracker;
`);

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
        riskAssessment: true
      },
      configuration: {
        maxConcurrentTasks: 10,
        timeoutMs: 600000, // 10 minutes
        retryAttempts: 2
      },
      metadata: {
        specialization: 'project_management',
        teamRole: 'coordinator',
        yearsExperience: 8
      }
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
        apiIntegration: true
      },
      configuration: {
        maxConcurrentTasks: 3,
        timeoutMs: 480000, // 8 minutes
        retryAttempts: 2
      },
      metadata: {
        specialization: 'frontend_development',
        teamRole: 'developer',
        technologies: ['React', 'TypeScript', 'CSS', 'Jest']
      }
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
        securityImplementation: true
      },
      configuration: {
        maxConcurrentTasks: 4,
        timeoutMs: 600000, // 10 minutes
        retryAttempts: 2
      },
      metadata: {
        specialization: 'backend_development',
        teamRole: 'developer',
        technologies: ['Node.js', 'PostgreSQL', 'Redis', 'Docker']
      }
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
        testPlanCreation: true
      },
      configuration: {
        maxConcurrentTasks: 5,
        timeoutMs: 360000, // 6 minutes
        retryAttempts: 1
      },
      metadata: {
        specialization: 'quality_assurance',
        teamRole: 'tester',
        testingFrameworks: ['Jest', 'Cypress', 'Selenium']
      }
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
        infrastructureAsCode: true
      },
      configuration: {
        maxConcurrentTasks: 6,
        timeoutMs: 900000, // 15 minutes
        retryAttempts: 3
      },
      metadata: {
        specialization: 'devops',
        teamRole: 'infrastructure',
        platforms: ['AWS', 'Docker', 'Kubernetes', 'GitHub Actions']
      }
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
    const startNode = this.workflowEngine.builder.addNode('start', 'Project Start', { x: 50, y: 200 });

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
        requiredExtensions: ['task-coordinator', 'progress-tracker']
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
          type: 'project'
        }
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
        requiredExtensions: ['progress-tracker']
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
        requiredExtensions: ['progress-tracker']
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
        syncPoints: ['api_design', 'integration_testing']
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
        requiredExtensions: ['progress-tracker']
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
        requiredExtensions: ['progress-tracker']
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
        requiredExtensions: ['task-coordinator', 'progress-tracker']
      }
    );

    const endNode = this.workflowEngine.builder.addNode('end', 'Project Complete', { x: 1150, y: 175 });

    // Connect the workflow
    this.workflowEngine.builder.addConnection(startNode.id, 'output', projectPlanningTask.id, 'task');
    this.workflowEngine.builder.addConnection(projectPlanningTask.id, 'result', communicationSetup.id, 'input');
    this.workflowEngine.builder.addConnection(communicationSetup.id, 'success', backendTask.id, 'task');
    this.workflowEngine.builder.addConnection(communicationSetup.id, 'success', frontendTask.id, 'task');
    this.workflowEngine.builder.addConnection(backendTask.id, 'result', teamCoordination.id, 'agents');
    this.workflowEngine.builder.addConnection(frontendTask.id, 'result', teamCoordination.id, 'agents');
    this.workflowEngine.builder.addConnection(teamCoordination.id, 'synchronized', qaTask.id, 'task');
    this.workflowEngine.builder.addConnection(qaTask.id, 'approved', deploymentPrepTask.id, 'task');
    this.workflowEngine.builder.addConnection(deploymentPrepTask.id, 'result', projectReviewTask.id, 'task');
    this.workflowEngine.builder.addConnection(projectReviewTask.id, 'result', endNode.id, 'input');

    // Save workflow
    const savedWorkflow = await this.workflowEngine.repository.createWorkflow(workflow);
    
    this.logger.info(\`Feature development workflow created with ID: \${savedWorkflow.id}\`);
    return savedWorkflow.id;
  }

  /**
   * Execute a collaborative project
   */
  async executeCollaborativeProject(): Promise<void> {
    this.logger.info('Starting collaborative project execution...');

    // Get the feature development workflow
    const workflows = await this.workflowEngine.repository.getAllWorkflows();
    const featureWorkflow = workflows.find(w => w.name.includes('Feature Development'));

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
        'Accessibility compliance'
      ],
      priority: 'high',
      estimatedDuration: 240, // 4 hours total
      budget: 50000,
      stakeholders: ['Product Manager', 'UX Designer', 'Customer Support'],
      technicalConstraints: {
        framework: 'React 18',
        backend: 'Node.js with Express',
        database: 'PostgreSQL',
        deployment: 'AWS ECS'
      }
    };

    // Execute the collaborative workflow
    const executionId = await this.workflowEngine.engine.executeWorkflow(
      featureWorkflow.id,
      {
        project: projectSpec,
        teamConfiguration: {
          projectManager: this.agentIds.projectManager,
          frontendDeveloper: this.agentIds.frontendDeveloper,
          backendDeveloper: this.agentIds.backendDeveloper,
          qaTester: this.agentIds.qaTester,
          devopsEngineer: this.agentIds.devopsEngineer
        },
        collaborationSettings: {
          communicationFrequency: 'high',
          progressReportingInterval: 15, // 15 minutes
          autoSyncEnabled: true,
          conflictResolutionStrategy: 'escalate_to_pm'
        },
        metadata: {
          requestId: 'collab_project_001',
          initiatedBy: 'system',
          timestamp: new Date()
        }
      }
    );

    this.logger.info(\`Collaborative project execution started with ID: \${executionId}\`);

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
          this.logger.info(\`Collaboration status: \${lastStatus} -> \${execution?.status}\`);
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
            this.logger.error(\`Collaborative project failed: \${execution?.error}\`);
          }
        }

      } catch (error) {
        this.logger.error(\`Error monitoring collaboration: \${error.message}\`);
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
        const activeTasks = profile.todoList?.filter(task => task.status === 'in_progress').length || 0;
        const completedTasks = profile.completedTasks || 0;
        
        this.logger.info(\`\${role}: \${completedTasks} completed, \${activeTasks} active tasks\`);
      } catch (error) {
        this.logger.warn(\`Error getting progress for \${role}: \${error.message}\`);
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
        duration: execution?.endTime ? execution.endTime - execution.startTime : null
      },
      teamPerformance: {},
      collaboration: {
        handoffs: 0,
        communications: 0,
        conflictsResolved: 0
      },
      outcomes: {
        tasksCompleted: 0,
        qualityScore: 0,
        efficiency: 0
      }
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
          averageTaskDuration: profile.averageTaskDuration || 0
        };

        report.collaboration.handoffs += profile.handoffsInitiated || 0;
      } catch (error) {
        this.logger.warn(\`Error collecting data for \${role}: \${error.message}\`);
      }
    }

    // Calculate overall metrics
    const totalCompletedTasks = Object.values(report.teamPerformance)
      .reduce((sum: number, perf: any) => sum + perf.completedTasks, 0);
    
    report.outcomes.tasksCompleted = totalCompletedTasks;
    report.outcomes.efficiency = execution?.duration ? (totalCompletedTasks / (execution.duration / 60000)) : 0;

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
    this.logger.info(\`Active Agents: \${agents.length}\`);
    
    agents.forEach(agent => {
      this.logger.info(\`  - \${agent.name} (\${agent.type}): \${agent.status}\`);
    });

    // Extension status
    const extensionStats = this.extensionManager.getExtensionStats();
    this.logger.info(\`Active Extensions: \${extensionStats.activeExtensions}\`);

    // System health
    const systemHealth = await this.agentRegistry.getSystemHealth();
    this.logger.info(\`System Health: \${systemHealth.status}\`);

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

    if (this.prisma) {
      await this.prisma.$disconnect();
    }

    this.logger.info('Collaboration Application shut down successfully');
  }

  /**
   * Helper method to create extensions
   */
  private async createExtension(baseDir: string, name: string, type: string, content: string): Promise<void> {
    const extensionDir = path.join(baseDir, name);
    await fs.ensureDir(extensionDir);

    const manifest = {
      name: \`@collaboration/\${name}\`,
      version: '1.0.0',
      description: \`Collaboration extension: \${name}\`,
      type,
      category: 'collaboration',
      main: 'index.js',
      author: 'Collaboration App',
      keywords: ['collaboration', 'teamwork', 'coordination'],
      permissions: ['agent_control', 'workflow_modify']
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