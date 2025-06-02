import { PromptTemplateServiceImpl } from './packages/prompt-templating/src/PromptTemplateService.js';

// Create the handoff template using the new system
const createHandoffTemplate = async () => {
  const templateService = new PromptTemplateServiceImpl();

  // Create handoff prompt template
  const handoffTemplate = await templateService.createTemplate({
    name: 'Master Orchestrator Handoff Template',
    description: 'Standardized handoff template for AI-to-AI communication in The New Fuse',
    currentVersion: '',
    versions: [],
    blocks: [
      {
        id: 'system-block',
        type: 'system',
        content: 'You are the {{agent_role}} for The New Fuse platform. Your mission is to {{mission_objective}} while maintaining continuity from the previous agent.',
        position: 0,
        locked: true,
        metadata: {
          name: 'Agent Role Definition',
          description: 'Defines the AI agent role and core mission'
        }
      },
      {
        id: 'context-block',
        type: 'context',
        content: `## Current Project State: {{current_phase}}

### Completed Tasks:
{{completed_tasks}}

### Pending Tasks:
{{pending_tasks}}

### Available Resources:
{{available_resources}}

### Integration Points:
{{integration_points}}`,
        position: 1,
        locked: false,
        metadata: {
          name: 'Project Context',
          description: 'Current state and available resources'
        }
      },
      {
        id: 'task-block',
        type: 'instruction',
        content: `## Immediate Objectives

### Primary Task: {{next_logical_task}}

{{task_details}}

### Success Criteria:
{{success_metrics}}

### Constraints:
{{constraints}}`,
        position: 2,
        locked: false,
        metadata: {
          name: 'Task Definition',
          description: 'Specific objectives and deliverables'
        }
      },
      {
        id: 'output-block',
        type: 'user',
        content: `## Expected Deliverables

1. **Implementation**: {{implementation_requirements}}
2. **Documentation**: {{documentation_requirements}}
3. **Next Handoff**: Create the next handoff template using the prompt templating system
4. **Status Update**: Update all template variables for continuity

### Template Variables to Update:
{{template_variables_list}}`,
        position: 3,
        locked: false,
        metadata: {
          name: 'Output Requirements',
          description: 'Expected deliverables and handoff requirements'
        }
      },
      {
        id: 'next-action-block',
        type: 'assistant',
        content: `## For the Next AI Agent

**Critical Instructions:**
1. Use the Modular Prompt Templating System at {{template_system_location}}
2. Update template version with current status
3. Set {{next_logical_task}} to: {{recommended_next_task}}
4. Document progress in {{progress_log_location}}
5. Maintain agent coordination protocols

**Handoff Checklist:**
- [ ] Template variables updated
- [ ] Progress documented
- [ ] Next task defined
- [ ] Success metrics recorded
- [ ] Integration status verified`,
        position: 4,
        locked: true,
        metadata: {
          name: 'Next Agent Instructions',
          description: 'Critical handoff requirements for continuity'
        }
      }
    ],
    variables: {
      agent_role: 'Master Orchestrator Agent',
      mission_objective: 'complete platform buildout and establish multi-agent coordination',
      current_phase: 'Platform Integration and Agent Coordination',
      completed_tasks: `✅ Modular Prompt Templating System - Fully implemented and integrated
✅ Workflow Builder Enhancement - Template nodes added
✅ PromptLayer-style Interface - Complete with version control
✅ Service Architecture - Full CRUD operations and analytics
✅ Integration Scripts - Ready for deployment`,
      pending_tasks: `🔧 Package Integration - Add to build system and workspace
🔧 Frontend Route Integration - Add template editor routes
🔧 Database Integration - Connect to persistent storage when ready
🔧 Agent Training - Teach agents to use templating system
🔧 Template Optimization - Analytics-driven improvements`,
      available_resources: `- MCP Server Tooling: Full file operations
- Port Management System: Automated conflict resolution
- Prompt Templating System: Modular template creation and management
- Workflow Builder: Enhanced with template nodes
- VS Code Extensions: Direct code implementation
- Chrome Extensions: Advisory and GitHub integration`,
      integration_points: `- Workflow Builder: Template nodes integrated
- Service Layer: PromptTemplateService ready for backend
- Frontend Components: React components with TypeScript
- Package System: Workspace-ready modular architecture`,
      next_logical_task: 'Complete package integration and test end-to-end functionality',
      task_details: `Execute the integration script and verify the templating system works within the workflow builder. Test template creation, version control, and workflow node functionality.`,
      success_metrics: `- Package builds successfully
- Frontend loads template interface without errors
- Template nodes appear in workflow builder
- Template creation and editing works
- Export to workflow functionality operates correctly`,
      constraints: `- Maintain backward compatibility with existing workflow system
- Use existing package and build patterns
- Ensure TypeScript type safety throughout
- Follow established architectural patterns`,
      implementation_requirements: 'Run integration script, test functionality, fix any issues',
      documentation_requirements: 'Update integration status, document any fixes or improvements',
      template_variables_list: `{{current_phase}}, {{completed_tasks}}, {{pending_tasks}}, {{next_logical_task}}, {{success_metrics}}`,
      template_system_location: '/packages/prompt-templating/',
      recommended_next_task: 'Test full system integration and begin agent coordination protocols',
      progress_log_location: '/PROMPT_TEMPLATING_IMPLEMENTATION_LOG.md'
    },
    tags: ['handoff', 'orchestration', 'ai-coordination', 'templating'],
    category: 'Agent Coordination',
    isPublic: false,
    analytics: {
      totalRuns: 0,
      successRate: 0,
      popularVariables: ['next_logical_task', 'current_phase', 'completed_tasks'],
      recentActivity: []
    }
  });

  // Create the initial version
  const initialVersion = await templateService.createVersion(handoffTemplate.id, {
    version: 1,
    name: 'Initial Template',
    label: 'production',
    content: handoffTemplate.blocks.map(block => block.content).join('\n\n'),
    variables: handoffTemplate.variables,
    blocks: handoffTemplate.blocks,
    createdBy: 'Master Orchestrator Agent',
    isActive: true,
    changelog: 'Initial handoff template creation using modular prompt templating system'
  });

  // Set as active version
  await templateService.setActiveVersion(handoffTemplate.id, initialVersion.id);

  return { template: handoffTemplate, version: initialVersion };
};

export { createHandoffTemplate };
