/**
 * Additional Tool Handlers for The New Fuse MCP API Wrapper
 * Contains remaining tool definitions and handlers
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export class ApiWrapperHandlers {
  
  // ========== WORKFLOW MANAGEMENT TOOLS ==========
  static getWorkflowTools(): Tool[] {
    return [
      {
        name: 'workflow_list',
        description: 'Get all workflows',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Page number' },
            limit: { type: 'number', description: 'Items per page' },
          },
        },
      },
      {
        name: 'workflow_get',
        description: 'Get workflow by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Workflow ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'workflow_create',
        description: 'Create a new workflow',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Workflow name' },
            description: { type: 'string', description: 'Workflow description' },
            steps: { type: 'array', items: { type: 'object' }, description: 'Workflow steps' },
            triggers: { type: 'array', items: { type: 'object' }, description: 'Workflow triggers' },
            config: { type: 'object', description: 'Workflow configuration' },
          },
          required: ['name', 'steps'],
        },
      },
      {
        name: 'workflow_update',
        description: 'Update an existing workflow',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Workflow ID' },
            name: { type: 'string', description: 'Workflow name' },
            description: { type: 'string', description: 'Workflow description' },
            steps: { type: 'array', items: { type: 'object' }, description: 'Workflow steps' },
            triggers: { type: 'array', items: { type: 'object' }, description: 'Workflow triggers' },
            config: { type: 'object', description: 'Workflow configuration' },
          },
          required: ['id'],
        },
      },
      {
        name: 'workflow_delete',
        description: 'Delete a workflow',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Workflow ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'workflow_execute',
        description: 'Execute a workflow',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Workflow ID' },
            input: { type: 'object', description: 'Workflow input data' },
            context: { type: 'object', description: 'Execution context' },
          },
          required: ['id'],
        },
      },
      {
        name: 'workflow_executions_get',
        description: 'Get workflow execution history',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Workflow ID' },
            page: { type: 'number', description: 'Page number' },
            limit: { type: 'number', description: 'Items per page' },
          },
          required: ['id'],
        },
      },
    ];
  }

  // ========== USER MANAGEMENT TOOLS ==========
  static getUserManagementTools(): Tool[] {
    return [
      {
        name: 'user_list',
        description: 'Get all users (Admin only)',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Page number' },
            limit: { type: 'number', description: 'Items per page' },
            role: { type: 'string', description: 'Filter by role' },
          },
        },
      },
      {
        name: 'user_get',
        description: 'Get user by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'user_create',
        description: 'Create a new user (Admin only)',
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'User email' },
            name: { type: 'string', description: 'User full name' },
            password: { type: 'string', description: 'User password' },
            role: { type: 'string', enum: ['USER', 'ADMIN', 'CREATOR'], description: 'User role' },
          },
          required: ['email', 'name', 'password'],
        },
      },
      {
        name: 'user_update',
        description: 'Update user information',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User ID' },
            name: { type: 'string', description: 'User full name' },
            email: { type: 'string', description: 'User email' },
            role: { type: 'string', description: 'User role' },
          },
          required: ['id'],
        },
      },
      {
        name: 'user_delete',
        description: 'Delete a user (Admin only)',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User ID' },
          },
          required: ['id'],
        },
      },
    ];
  }

  // ========== MARKETPLACE TOOLS ==========
  static getMarketplaceTools(): Tool[] {
    return [
      {
        name: 'marketplace_items_list',
        description: 'Get all marketplace items',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Filter by category' },
            featured: { type: 'boolean', description: 'Filter featured items' },
            page: { type: 'number', description: 'Page number' },
            limit: { type: 'number', description: 'Items per page' },
          },
        },
      },
      {
        name: 'marketplace_item_get',
        description: 'Get marketplace item by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Item ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'marketplace_item_create',
        description: 'Create a new marketplace item (Creator/Admin)',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Item title' },
            description: { type: 'string', description: 'Item description' },
            category: { type: 'string', description: 'Item category' },
            price: { type: 'number', description: 'Item price' },
            config: { type: 'object', description: 'Item configuration' },
          },
          required: ['title', 'description', 'category'],
        },
      },
      {
        name: 'marketplace_item_update',
        description: 'Update marketplace item',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Item ID' },
            title: { type: 'string', description: 'Item title' },
            description: { type: 'string', description: 'Item description' },
            price: { type: 'number', description: 'Item price' },
            config: { type: 'object', description: 'Item configuration' },
          },
          required: ['id'],
        },
      },
      {
        name: 'marketplace_item_delete',
        description: 'Delete marketplace item (Admin only)',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Item ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'marketplace_subscribe',
        description: 'Subscribe to a marketplace item',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: { type: 'string', description: 'Item ID' },
            tier: { type: 'string', description: 'Subscription tier' },
          },
          required: ['itemId'],
        },
      },
      {
        name: 'marketplace_subscription_cancel',
        description: 'Cancel subscription',
        inputSchema: {
          type: 'object',
          properties: {
            subscriptionId: { type: 'string', description: 'Subscription ID' },
          },
          required: ['subscriptionId'],
        },
      },
      {
        name: 'marketplace_subscriptions_list',
        description: 'Get user subscriptions',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'marketplace_check_access',
        description: 'Check user access to marketplace item',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: { type: 'string', description: 'Item ID' },
          },
          required: ['itemId'],
        },
      },
    ];
  }

  // ========== AGENCY HUB TOOLS ==========
  static getAgencyHubTools(): Tool[] {
    return [
      {
        name: 'agency_list',
        description: 'List all agencies (Master Admin)',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Page number' },
            limit: { type: 'number', description: 'Items per page' },
          },
        },
      },
      {
        name: 'agency_create',
        description: 'Create new agency (Master Admin)',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Agency name' },
            description: { type: 'string', description: 'Agency description' },
            config: { type: 'object', description: 'Agency configuration' },
            adminEmail: { type: 'string', description: 'Agency admin email' },
          },
          required: ['name', 'adminEmail'],
        },
      },
      {
        name: 'agency_get',
        description: 'Get agency details',
        inputSchema: {
          type: 'object',
          properties: {
            agencyId: { type: 'string', description: 'Agency ID' },
          },
          required: ['agencyId'],
        },
      },
      {
        name: 'agency_update',
        description: 'Update agency information',
        inputSchema: {
          type: 'object',
          properties: {
            agencyId: { type: 'string', description: 'Agency ID' },
            name: { type: 'string', description: 'Agency name' },
            description: { type: 'string', description: 'Agency description' },
            config: { type: 'object', description: 'Agency configuration' },
          },
          required: ['agencyId'],
        },
      },
      {
        name: 'agency_delete',
        description: 'Delete agency (Master Admin)',
        inputSchema: {
          type: 'object',
          properties: {
            agencyId: { type: 'string', description: 'Agency ID' },
          },
          required: ['agencyId'],
        },
      },
      {
        name: 'agency_dashboard_get',
        description: 'Get agency dashboard data',
        inputSchema: {
          type: 'object',
          properties: {
            agencyId: { type: 'string', description: 'Agency ID' },
          },
        },
      },
      {
        name: 'agency_swarm_status',
        description: 'Get agency swarm status',
        inputSchema: {
          type: 'object',
          properties: {
            agencyId: { type: 'string', description: 'Agency ID' },
          },
        },
      },
      {
        name: 'agency_swarm_initialize',
        description: 'Initialize swarm for agency',
        inputSchema: {
          type: 'object',
          properties: {
            agencyId: { type: 'string', description: 'Agency ID' },
            config: { type: 'object', description: 'Swarm configuration' },
          },
          required: ['agencyId'],
        },
      },
      {
        name: 'agency_analytics_get',
        description: 'Get agency analytics',
        inputSchema: {
          type: 'object',
          properties: {
            agencyId: { type: 'string', description: 'Agency ID' },
            startDate: { type: 'string', description: 'Start date' },
            endDate: { type: 'string', description: 'End date' },
          },
        },
      },
      {
        name: 'agency_service_request_submit',
        description: 'Submit service request',
        inputSchema: {
          type: 'object',
          properties: {
            agencyId: { type: 'string', description: 'Agency ID' },
            serviceType: { type: 'string', description: 'Service type' },
            description: { type: 'string', description: 'Request description' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Request priority' },
          },
          required: ['agencyId', 'serviceType', 'description'],
        },
      },
      {
        name: 'agency_service_requests_list',
        description: 'Get agency service requests',
        inputSchema: {
          type: 'object',
          properties: {
            agencyId: { type: 'string', description: 'Agency ID' },
            status: { type: 'string', description: 'Filter by status' },
          },
        },
      },
    ];
  }

  // ========== ADMIN & MONITORING TOOLS ==========
  static getAdminTools(): Tool[] {
    return [
      {
        name: 'admin_metrics_get',
        description: 'Get system metrics (Admin only)',
        inputSchema: {
          type: 'object',
          properties: {
            timeRange: { type: 'string', enum: ['1h', '24h', '7d', '30d'], description: 'Time range' },
            metrics: { type: 'array', items: { type: 'string' }, description: 'Specific metrics to retrieve' },
          },
        },
      },
      {
        name: 'admin_health_get',
        description: 'Get detailed system health (Admin only)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'admin_audit_logs_get',
        description: 'Get audit logs (Admin only)',
        inputSchema: {
          type: 'object',
          properties: {
            startDate: { type: 'string', description: 'Start date' },
            endDate: { type: 'string', description: 'End date' },
            userId: { type: 'string', description: 'Filter by user ID' },
            action: { type: 'string', description: 'Filter by action type' },
            page: { type: 'number', description: 'Page number' },
            limit: { type: 'number', description: 'Items per page' },
          },
        },
      },
      {
        name: 'admin_script_run',
        description: 'Execute administrative script (Admin only)',
        inputSchema: {
          type: 'object',
          properties: {
            scriptName: { type: 'string', description: 'Script name' },
            parameters: { type: 'object', description: 'Script parameters' },
          },
          required: ['scriptName'],
        },
      },
      {
        name: 'admin_roles_get',
        description: 'Get user roles (Admin only)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'admin_role_permissions_update',
        description: 'Update role permissions (Admin only)',
        inputSchema: {
          type: 'object',
          properties: {
            roleId: { type: 'string', description: 'Role ID' },
            permissions: { type: 'array', items: { type: 'string' }, description: 'Permission list' },
          },
          required: ['roleId', 'permissions'],
        },
      },
      {
        name: 'health_check',
        description: 'Basic health check',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'platform_status_get',
        description: 'Get comprehensive platform status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  // ========== INTEGRATION TOOLS ==========
  static getIntegrationTools(): Tool[] {
    return [
      {
        name: 'integration_n8n_workflow_create',
        description: 'Create N8N workflow with validation',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Workflow name' },
            nodes: { type: 'array', items: { type: 'object' }, description: 'Workflow nodes' },
            connections: { type: 'object', description: 'Node connections' },
            settings: { type: 'object', description: 'Workflow settings' },
          },
          required: ['name', 'nodes'],
        },
      },
      {
        name: 'integration_n8n_node_types_get',
        description: 'Get available N8N node types',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'integration_n8n_node_type_get',
        description: 'Get specific N8N node type description',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Node type name' },
          },
          required: ['type'],
        },
      },
      {
        name: 'integration_n8n_credentials_get',
        description: 'Get N8N credentials for type',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Credential type' },
          },
          required: ['type'],
        },
      },
      {
        name: 'integration_n8n_workflow_test',
        description: 'Test N8N workflow execution',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: { type: 'string', description: 'Workflow ID' },
            testData: { type: 'object', description: 'Test input data' },
          },
          required: ['workflowId'],
        },
      },
      {
        name: 'integration_llm_providers_list',
        description: 'Get all LLM providers',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'integration_llm_provider_create',
        description: 'Create new LLM provider',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Provider name' },
            type: { type: 'string', description: 'Provider type' },
            config: { type: 'object', description: 'Provider configuration' },
            apiKey: { type: 'string', description: 'API key' },
          },
          required: ['name', 'type', 'config'],
        },
      },
      {
        name: 'integration_llm_provider_update',
        description: 'Update LLM provider',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Provider ID' },
            name: { type: 'string', description: 'Provider name' },
            config: { type: 'object', description: 'Provider configuration' },
            apiKey: { type: 'string', description: 'API key' },
          },
          required: ['id'],
        },
      },
      {
        name: 'integration_llm_provider_delete',
        description: 'Delete LLM provider',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Provider ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'integration_llm_provider_set_default',
        description: 'Set LLM provider as default',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Provider ID' },
          },
          required: ['id'],
        },
      },
    ];
  }
}

export default ApiWrapperHandlers;