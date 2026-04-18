/**
 * Tool Permission Checker
 *
 * Validates user/agent permissions before executing MCP tools.
 * Implements capability-based access control for cloud sandbox tools.
 */

import type { AuthenticatedUser } from './CloudSandboxAuthGuard.js';

export interface ToolPermissionConfig {
  toolName: string;
  requiredPermissions: string[];
  requiredCapabilities?: string[];
  allowedRoles?: string[];
  requiresTenantIsolation: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: string[];
  requiredCapabilities?: string[];
}

/**
 * Tool Permission Checker
 */
export class ToolPermissionChecker {
  private readonly toolPermissions: Map<string, ToolPermissionConfig>;

  constructor() {
    this.toolPermissions = this.initializeToolPermissions();
  }

  /**
   * Check if user/agent has permission to execute a tool
   */
  checkPermission(
    toolName: string,
    user: AuthenticatedUser,
    params?: Record<string, unknown>
  ): PermissionCheckResult {
    const config = this.toolPermissions.get(toolName);

    if (!config) {
      console.warn(`Unknown tool: ${toolName}`);
      return {
        allowed: false,
        reason: 'Unknown tool',
      };
    }

    // Check role-based access
    if (config.allowedRoles && config.allowedRoles.length > 0) {
      if (!config.allowedRoles.includes(user.role)) {
        return {
          allowed: false,
          reason: `Role ${user.role} not authorized for tool ${toolName}`,
          requiredPermissions: config.requiredPermissions,
        };
      }
    }

    // Check required permissions
    const hasRequiredPermissions = config.requiredPermissions.every((perm) =>
      user.permissions.includes(perm)
    );

    if (!hasRequiredPermissions) {
      return {
        allowed: false,
        reason: 'Missing required permissions',
        requiredPermissions: config.requiredPermissions,
      };
    }

    // Check required capabilities (for agents)
    if (config.requiredCapabilities && config.requiredCapabilities.length > 0) {
      const hasRequiredCapabilities = config.requiredCapabilities.some((cap) =>
        user.capabilities.some((userCap) => userCap.includes(cap) || cap.includes(userCap))
      );

      if (!hasRequiredCapabilities && user.type === 'agent') {
        return {
          allowed: false,
          reason: 'Agent lacks required capabilities',
          requiredCapabilities: config.requiredCapabilities,
        };
      }
    }

    // Additional checks for high-risk tools
    if (config.riskLevel === 'critical' || config.riskLevel === 'high') {
      const securityCheck = this.performSecurityCheck(toolName, user, params);
      if (!securityCheck.allowed) {
        return securityCheck;
      }
    }

    console.debug(
      `Permission granted: ${user.type}:${user.id} -> ${toolName} (role: ${user.role})`
    );

    return { allowed: true };
  }

  /**
   * Perform additional security checks for high-risk tools
   */
  private performSecurityCheck(
    toolName: string,
    user: AuthenticatedUser,
    params?: Record<string, unknown>
  ): PermissionCheckResult {
    // Check for dangerous commands
    if (toolName === 'run_command' && params?.command) {
      const command = params.command as string;
      const dangerousPatterns = [
        /rm\s+-rf\s+\//, // Delete root
        /dd\s+if=/, // Disk operations
        /mkfs/, // Format filesystem
        /:(){ :|:& };:/, // Fork bomb
        />\s*\/dev\/sd/, // Direct disk write
        /curl.*\|\s*bash/, // Pipe to bash
        /wget.*\|\s*sh/, // Pipe to shell
      ];

      const isDangerous = dangerousPatterns.some((pattern) => pattern.test(command));

      if (isDangerous) {
        // Only SUPER_ADMIN can run potentially dangerous commands
        if (user.role !== 'SUPER_ADMIN') {
          console.warn(`Blocked dangerous command from ${user.type}:${user.id}: ${command}`);
          return {
            allowed: false,
            reason: 'Dangerous command requires SUPER_ADMIN role',
          };
        }
      }
    }

    // Check for sensitive file access
    if ((toolName === 'read_file' || toolName === 'write_file') && params?.path) {
      const path = params.path as string;
      const sensitivePatterns = [
        /\/etc\/passwd/,
        /\/etc\/shadow/,
        /\.ssh\//,
        /\.aws\//,
        /\.env$/,
        /credentials/,
        /secrets/,
      ];

      const isSensitive = sensitivePatterns.some((pattern) => pattern.test(path));

      if (isSensitive) {
        // Only ADMIN and above can access sensitive files
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'AGENCY_OWNER'];
        if (!allowedRoles.includes(user.role)) {
          console.warn(`Blocked sensitive file access from ${user.type}:${user.id}: ${path}`);
          return {
            allowed: false,
            reason: 'Sensitive file access requires elevated permissions',
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Initialize tool permission configurations
   */
  private initializeToolPermissions(): Map<string, ToolPermissionConfig> {
    const configs: ToolPermissionConfig[] = [
      // Browser automation tools - MEDIUM risk
      {
        toolName: 'browser_navigate',
        requiredPermissions: ['cloud-sandbox:browser'],
        requiredCapabilities: [],
        requiresTenantIsolation: true,
        riskLevel: 'medium',
      },
      {
        toolName: 'browser_screenshot',
        requiredPermissions: ['cloud-sandbox:browser'],
        requiresTenantIsolation: true,
        riskLevel: 'low',
      },
      {
        toolName: 'browser_click',
        requiredPermissions: ['cloud-sandbox:browser'],
        requiresTenantIsolation: true,
        riskLevel: 'medium',
      },
      {
        toolName: 'browser_type',
        requiredPermissions: ['cloud-sandbox:browser'],
        requiresTenantIsolation: true,
        riskLevel: 'medium',
      },
      {
        toolName: 'browser_evaluate',
        requiredPermissions: ['cloud-sandbox:browser'],
        requiresTenantIsolation: true,
        riskLevel: 'high',
      },
      {
        toolName: 'browser_get_html',
        requiredPermissions: ['cloud-sandbox:browser'],
        requiresTenantIsolation: true,
        riskLevel: 'low',
      },

      // Shell command execution - CRITICAL risk
      {
        toolName: 'run_command',
        requiredPermissions: ['cloud-sandbox:execute'],
        requiredCapabilities: ['CODE_EXECUTION'],
        requiresTenantIsolation: true,
        riskLevel: 'critical',
      },

      // File system operations - HIGH risk
      {
        toolName: 'read_file',
        requiredPermissions: ['cloud-sandbox:files'],
        requiresTenantIsolation: true,
        riskLevel: 'medium',
      },
      {
        toolName: 'write_file',
        requiredPermissions: ['cloud-sandbox:files'],
        requiresTenantIsolation: true,
        riskLevel: 'high',
      },
      {
        toolName: 'list_directory',
        requiredPermissions: ['cloud-sandbox:files'],
        requiresTenantIsolation: true,
        riskLevel: 'low',
      },
      {
        toolName: 'create_directory',
        requiredPermissions: ['cloud-sandbox:files'],
        requiresTenantIsolation: true,
        riskLevel: 'medium',
      },

      // Environment operations - MEDIUM risk
      {
        toolName: 'get_env_info',
        requiredPermissions: ['cloud-sandbox:system'],
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'AGENCY_OWNER'],
        requiresTenantIsolation: false,
        riskLevel: 'medium',
      },

      // Monitoring operations - LOW risk
      {
        toolName: 'ping',
        requiredPermissions: ['cloud-sandbox:monitor'],
        requiresTenantIsolation: false,
        riskLevel: 'low',
      },
      {
        toolName: 'get_status',
        requiredPermissions: ['cloud-sandbox:monitor'],
        requiresTenantIsolation: false,
        riskLevel: 'low',
      },
    ];

    return new Map(configs.map((config) => [config.toolName, config]));
  }

  /**
   * Get permission requirements for a tool
   */
  getToolPermissions(toolName: string): ToolPermissionConfig | undefined {
    return this.toolPermissions.get(toolName);
  }

  /**
   * Get all available tools for a user/agent
   */
  getAvailableTools(user: AuthenticatedUser): string[] {
    const availableTools: string[] = [];

    for (const [toolName, _config] of this.toolPermissions.entries()) {
      const check = this.checkPermission(toolName, user);
      if (check.allowed) {
        availableTools.push(toolName);
      }
    }

    return availableTools;
  }

  /**
   * Validate tenant isolation for cross-tenant access attempts
   */
  validateTenantAccess(userTenantId: string, resourceTenantId: string, userRole: string): boolean {
    // SUPER_ADMIN can access all tenants
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }

    // All others must stay within their tenant
    return userTenantId === resourceTenantId;
  }
}
