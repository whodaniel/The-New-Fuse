/**
 * Template Validator
 * Validates infrastructure templates for correctness and best practices
 */

import {
  InfrastructureTemplate,
  ResourceDefinition,
  ErrorSeverity,
  SuggestionType,
  ResourceType,
  VariableType
} from '../types/infrastructure.js';

export interface ValidationRule {
  name: string;
  description: string;
  severity: ErrorSeverity;
  validate(template: InfrastructureTemplate): ValidationIssue[];
}

export interface ValidationIssue {
  rule: string;
  severity: ErrorSeverity;
  message: string;
  path: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  suggestions: ValidationIssue[];
}

export class TemplateValidator {
  private rules: ValidationRule[];
  private customRules: Map<string, ValidationRule>;

  constructor() {
    this.rules = [];
    this.customRules = new Map();
    this.initializeDefaultRules();
  }

  async validate(template: InfrastructureTemplate): Promise<ValidationResult> {
    try {
      const issues: ValidationIssue[] = [];

      // Run all validation rules
      for (const rule of this.rules) {
        try {
          const ruleIssues = rule.validate(template);
          issues.push(...ruleIssues);
        } catch (error) {
          issues.push({
            rule: rule.name,
            severity: ErrorSeverity.ERROR,
            message: `Validation rule failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            path: 'template'
          });
        }
      }

      // Run custom rules
      for (const [name, rule] of this.customRules) {
        try {
          const ruleIssues = rule.validate(template);
          issues.push(...ruleIssues);
        } catch (error) {
          issues.push({
            rule: name,
            severity: ErrorSeverity.ERROR,
            message: `Custom validation rule failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            path: 'template'
          });
        }
      }

      // Categorize issues
      const errors = issues
        .filter(i => i.severity === ErrorSeverity.ERROR)
        .map(i => ({
          code: i.rule,
          message: i.message,
          path: i.path,
          severity: i.severity
        }));

      const warnings = issues
        .filter(i => i.severity === ErrorSeverity.WARNING)
        .map(i => ({
          code: i.rule,
          message: i.message,
          path: i.path,
          recommendation: i.suggestion || 'Review and consider fixing this issue'
        }));

      const suggestions = issues
        .filter(i => i.severity === ErrorSeverity.INFO && i.suggestion)
        .map(i => ({
          type: this.getSuggestionType(i.rule),
          message: i.message,
          path: i.path,
          improvement: i.suggestion!
        }));

      const mappedErrors = errors.map(err => ({
        ...err,
        rule: err.code || 'unknown',
        severity: ErrorSeverity.ERROR
      }));
      
      const mappedWarnings = warnings.map(warn => ({
        ...warn,
        rule: warn.code || 'unknown',
        severity: ErrorSeverity.WARNING
      }));
      
      const mappedSuggestions = suggestions.map(sugg => ({
        ...sugg,
        rule: sugg.type || 'unknown',
        severity: ErrorSeverity.INFO,
        message: sugg.message,
        path: sugg.path
      }));

      return {
        isValid: errors.length === 0,
        issues: [...mappedErrors, ...mappedWarnings, ...mappedSuggestions],
        errors: mappedErrors,
        warnings: mappedWarnings,
        suggestions: mappedSuggestions
      };

    } catch (error) {
      const errorIssue = {
        rule: 'VALIDATION_FAILED',
        message: `Template validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        path: 'template',
        severity: ErrorSeverity.ERROR
      };

      return {
        isValid: false,
        issues: [errorIssue],
        errors: [errorIssue],
        warnings: [],
        suggestions: []
      };
    }
  }

  addCustomRule(name: string, rule: ValidationRule): void {
    this.customRules.set(name, rule);
  }

  removeCustomRule(name: string): void {
    this.customRules.delete(name);
  }

  getAvailableRules(): string[] {
    return [
      ...this.rules.map(r => r.name),
      ...Array.from(this.customRules.keys())
    ];
  }

  private initializeDefaultRules(): void {
    this.rules = [
      new RequiredFieldsRule(),
      new ResourceNamingRule(),
      new DependencyValidationRule(),
      new VariableValidationRule(),
      new SecurityValidationRule(),
      new PerformanceValidationRule(),
      new CostOptimizationRule(),
      new BestPracticesRule()
    ];
  }

  private getSuggestionType(ruleName: string): SuggestionType {
    if (ruleName.includes('security')) return SuggestionType.SECURITY;
    if (ruleName.includes('cost')) return SuggestionType.COST;
    if (ruleName.includes('performance')) return SuggestionType.PERFORMANCE;
    return SuggestionType.OPTIMIZATION;
  }
}

// Validation Rules Implementation

class RequiredFieldsRule implements ValidationRule {
  name = 'required-fields';
  description = 'Validates that all required fields are present';
  severity = ErrorSeverity.ERROR;

  validate(template: InfrastructureTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Validate template required fields
    if (!template.id) {
      issues.push({
        rule: this.name,
        severity: this.severity,
        message: 'Template ID is required',
        path: 'template.id'
      });
    }

    if (!template.name) {
      issues.push({
        rule: this.name,
        severity: this.severity,
        message: 'Template name is required',
        path: 'template.name'
      });
    }

    if (!template.version) {
      issues.push({
        rule: this.name,
        severity: this.severity,
        message: 'Template version is required',
        path: 'template.version'
      });
    }

    if (!template.provider) {
      issues.push({
        rule: this.name,
        severity: this.severity,
        message: 'Template provider is required',
        path: 'template.provider'
      });
    }

    // Validate resource required fields
    template.resources.forEach((resource, index) => {
      if (!resource.name) {
        issues.push({
          rule: this.name,
          severity: this.severity,
          message: 'Resource name is required',
          path: `template.resources[${index}].name`
        });
      }

      if (!resource.type) {
        issues.push({
          rule: this.name,
          severity: this.severity,
          message: 'Resource type is required',
          path: `template.resources[${index}].type`
        });
      }
    });

    return issues;
  }
}

class ResourceNamingRule implements ValidationRule {
  name = 'resource-naming';
  description = 'Validates resource naming conventions';
  severity = ErrorSeverity.WARNING;

  validate(template: InfrastructureTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const namePattern = /^[a-z][a-z0-9-]*[a-z0-9]$/;
    const reservedNames = ['default', 'system', 'admin', 'root'];

    template.resources.forEach((resource, index) => {
      if (resource.name) {
        // Check naming pattern
        if (!namePattern.test(resource.name)) {
          issues.push({
            rule: this.name,
            severity: this.severity,
            message: 'Resource name should use lowercase letters, numbers, and hyphens only',
            path: `template.resources[${index}].name`,
            suggestion: 'Use kebab-case naming convention (e.g., my-resource-name)'
          });
        }

        // Check reserved names
        if (reservedNames.includes(resource.name.toLowerCase())) {
          issues.push({
            rule: this.name,
            severity: ErrorSeverity.ERROR,
            message: `Resource name "${resource.name}" is reserved`,
            path: `template.resources[${index}].name`,
            suggestion: 'Choose a different name that is not reserved'
          });
        }

        // Check name length
        if (resource.name.length > 63) {
          issues.push({
            rule: this.name,
            severity: this.severity,
            message: 'Resource name is too long (max 63 characters)',
            path: `template.resources[${index}].name`,
            suggestion: 'Shorten the resource name'
          });
        }
      }
    });

    return issues;
  }
}

class DependencyValidationRule implements ValidationRule {
  name = 'dependency-validation';
  description = 'Validates resource dependencies';
  severity = ErrorSeverity.ERROR;

  validate(template: InfrastructureTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const resourceNames = new Set(template.resources.map(r => r.name));

    template.resources.forEach((resource, index) => {
      if (resource.dependencies) {
        resource.dependencies.forEach((dep, depIndex) => {
          // Check if dependency exists
          if (!resourceNames.has(dep)) {
            issues.push({
              rule: this.name,
              severity: this.severity,
              message: `Resource depends on non-existent resource: ${dep}`,
              path: `template.resources[${index}].dependencies[${depIndex}]`,
              suggestion: 'Remove the dependency or add the missing resource'
            });
          }

          // Check for self-dependency
          if (dep === resource.name) {
            issues.push({
              rule: this.name,
              severity: this.severity,
              message: 'Resource cannot depend on itself',
              path: `template.resources[${index}].dependencies[${depIndex}]`,
              suggestion: 'Remove the self-dependency'
            });
          }
        });
      }
    });

    // Check for circular dependencies
    const circularDeps = this.findCircularDependencies(template.resources);
    circularDeps.forEach(cycle => {
      issues.push({
        rule: this.name,
        severity: this.severity,
        message: `Circular dependency detected: ${cycle.join(' -> ')}`,
        path: 'template.resources',
        suggestion: 'Break the circular dependency by removing or restructuring dependencies'
      });
    });

    return issues;
  }

  private findCircularDependencies(resources: ResourceDefinition[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const resourceMap = new Map(resources.map(r => [r.name, r]));

    const dfs = (resourceName: string, path: string[]): void => {
      if (recursionStack.has(resourceName)) {
        const cycleStart = path.indexOf(resourceName);
        cycles.push([...path.slice(cycleStart), resourceName]);
        return;
      }

      if (visited.has(resourceName)) {
        return;
      }

      visited.add(resourceName);
      recursionStack.add(resourceName);

      const resource = resourceMap.get(resourceName);
      if (resource && resource.dependencies) {
        for (const dep of resource.dependencies) {
          dfs(dep, [...path, resourceName]);
        }
      }

      recursionStack.delete(resourceName);
    };

    for (const resource of resources) {
      if (!visited.has(resource.name)) {
        dfs(resource.name, []);
      }
    }

    return cycles;
  }
}

class VariableValidationRule implements ValidationRule {
  name = 'variable-validation';
  description = 'Validates template variables';
  severity = ErrorSeverity.ERROR;

  validate(template: InfrastructureTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    template.variables.forEach((variable, index) => {
      // Check required fields
      if (!variable.name) {
        issues.push({
          rule: this.name,
          severity: this.severity,
          message: 'Variable name is required',
          path: `template.variables[${index}].name`
        });
      }

      if (!variable.type) {
        issues.push({
          rule: this.name,
          severity: this.severity,
          message: 'Variable type is required',
          path: `template.variables[${index}].type`
        });
      }

      // Validate variable name format
      if (variable.name && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(variable.name)) {
        issues.push({
          rule: this.name,
          severity: ErrorSeverity.WARNING,
          message: 'Variable name should start with a letter and contain only letters, numbers, and underscores',
          path: `template.variables[${index}].name`,
          suggestion: 'Use snake_case or camelCase naming convention'
        });
      }

      // Validate default value type
      if (variable.defaultValue !== undefined && variable.type) {
        const isValidType = this.validateVariableType(variable.defaultValue, variable.type);
        if (!isValidType) {
          issues.push({
            rule: this.name,
            severity: this.severity,
            message: `Default value type does not match variable type ${variable.type}`,
            path: `template.variables[${index}].defaultValue`,
            suggestion: 'Ensure the default value matches the declared variable type'
          });
        }
      }

      // Check for required variables without default values
      if (variable.required && variable.defaultValue === undefined) {
        issues.push({
          rule: this.name,
          severity: ErrorSeverity.WARNING,
          message: 'Required variable has no default value',
          path: `template.variables[${index}]`,
          suggestion: 'Consider providing a default value or ensure the variable is provided at runtime'
        });
      }
    });

    return issues;
  }

  private validateVariableType(value: any, type: VariableType): boolean {
    switch (type) {
      case VariableType.STRING:
        return typeof value === 'string';
      case VariableType.NUMBER:
        return typeof value === 'number';
      case VariableType.BOOLEAN:
        return typeof value === 'boolean';
      case VariableType.LIST:
        return Array.isArray(value);
      case VariableType.MAP:
      case VariableType.OBJECT:
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }
}

class SecurityValidationRule implements ValidationRule {
  name = 'security-validation';
  description = 'Validates security best practices';
  severity = ErrorSeverity.WARNING;

  validate(template: InfrastructureTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    template.resources.forEach((resource, index) => {
      // Check for hardcoded secrets
      const resourceStr = JSON.stringify(resource.properties);
      const secretPatterns = [
        /password\s*[:=]\s*["'][^"']+["']/i,
        /secret\s*[:=]\s*["'][^"']+["']/i,
        /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
        /token\s*[:=]\s*["'][^"']+["']/i
      ];

      secretPatterns.forEach(pattern => {
        if (pattern.test(resourceStr)) {
          issues.push({
            rule: this.name,
            severity: ErrorSeverity.ERROR,
            message: 'Hardcoded secrets detected in resource properties',
            path: `template.resources[${index}].properties`,
            suggestion: 'Use variables or secret management systems instead of hardcoded secrets'
          });
        }
      });

      // Check for overly permissive firewall rules
      if (resource.type === ResourceType.FIREWALL_RULE) {
        const sourceRanges = resource.properties.sourceRanges || [];
        sourceRanges.forEach((range: string, rangeIndex: number) => {
          if (range === '0.0.0.0/0' && resource.properties.allowed) {
            const allowedPorts = resource.properties.allowed.flatMap((a: any) => a.ports || []);
            if (!allowedPorts.includes('80') && !allowedPorts.includes('443')) {
              issues.push({
                rule: this.name,
                severity: this.severity,
                message: 'Firewall rule allows access from anywhere on non-standard port',
                path: `template.resources[${index}].properties.sourceRanges[${rangeIndex}]`,
                suggestion: 'Restrict access to specific IP ranges or use standard ports'
              });
            }
          }
        });
      }

      // Check for unencrypted storage
      if (resource.type === ResourceType.CLOUD_STORAGE) {
        if (!resource.properties.encryption || !resource.properties.encryption.enabled) {
          issues.push({
            rule: this.name,
            severity: this.severity,
            message: 'Cloud Storage bucket is not encrypted',
            path: `template.resources[${index}].properties`,
            suggestion: 'Enable encryption for Cloud Storage buckets'
          });
        }
      }
    });

    return issues;
  }
}

class PerformanceValidationRule implements ValidationRule {
  name = 'performance-validation';
  description = 'Validates performance best practices';
  severity = ErrorSeverity.INFO;

  validate(template: InfrastructureTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    template.resources.forEach((resource, index) => {
      // Check for undersized compute resources
      if (resource.type === ResourceType.COMPUTE_ENGINE) {
        const machineType = resource.properties.machineType;
        // Simple check for machine type - in production, would parse machine type specs

        if (machineType && (machineType.includes('f1-micro') || machineType.includes('g1-small'))) {
          issues.push({
            rule: this.name,
            severity: this.severity,
            message: 'Compute Engine instance may be undersized',
            path: `template.resources[${index}].properties.machineType`,
            suggestion: 'Consider using a larger machine type for better performance'
          });
        }
      }

      // Check for missing health checks
      if (resource.type === ResourceType.LOAD_BALANCER) {
        if (!resource.properties.healthCheck) {
          issues.push({
            rule: this.name,
            severity: ErrorSeverity.WARNING,
            message: 'Load balancer missing health check configuration',
            path: `template.resources[${index}].properties`,
            suggestion: 'Add health check configuration to ensure proper load balancing'
          });
        }
      }
    });

    return issues;
  }
}

class CostOptimizationRule implements ValidationRule {
  name = 'cost-optimization';
  description = 'Suggests cost optimization opportunities';
  severity = ErrorSeverity.INFO;

  validate(template: InfrastructureTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    template.resources.forEach((resource, index) => {
      // Check for oversized resources
      if (resource.type === ResourceType.COMPUTE_ENGINE) {
        const machineType = resource.properties.machineType;

        if (machineType && (machineType.includes('n1-highmem') || machineType.includes('n1-highcpu'))) {
          issues.push({
            rule: this.name,
            severity: this.severity,
            message: 'High-performance machine type detected - consider if full capacity is needed',
            path: `template.resources[${index}].properties.machineType`,
            suggestion: 'Review if a smaller machine type would be sufficient'
          });
        }
      }

      // Check for missing auto-scaling
      if (resource.type === ResourceType.COMPUTE_ENGINE && !resource.properties.autoScaling) {
        issues.push({
          rule: this.name,
          severity: this.severity,
          message: 'Compute Engine instance without auto-scaling may lead to over-provisioning',
          path: `template.resources[${index}].properties`,
          suggestion: 'Consider using Managed Instance Groups with auto-scaling to optimize costs'
        });
      }
    });

    return issues;
  }
}

class BestPracticesRule implements ValidationRule {
  name = 'best-practices';
  description = 'Validates general best practices';
  severity = ErrorSeverity.INFO;

  validate(template: InfrastructureTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for missing tags
    template.resources.forEach((resource, index) => {
      if (!resource.tags || Object.keys(resource.tags).length === 0) {
        issues.push({
          rule: this.name,
          severity: this.severity,
          message: 'Resource missing tags',
          path: `template.resources[${index}].tags`,
          suggestion: 'Add tags for better resource management and cost tracking'
        });
      }

      // Check for missing environment tag
      if (resource.tags && !resource.tags.environment) {
        issues.push({
          rule: this.name,
          severity: this.severity,
          message: 'Resource missing environment tag',
          path: `template.resources[${index}].tags`,
          suggestion: 'Add environment tag to identify resource environment'
        });
      }
    });

    // Check for missing description
    if (!template.metadata.description) {
      issues.push({
        rule: this.name,
        severity: this.severity,
        message: 'Template missing description',
        path: 'template.metadata.description',
        suggestion: 'Add a description to explain the purpose of this template'
      });
    }

    return issues;
  }
}