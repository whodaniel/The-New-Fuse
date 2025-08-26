/**
 * Template Parser
 * Handles parsing and generation of infrastructure templates
 */

import {
  InfrastructureTemplate,
  InfrastructureState,
  ResourceDefinition,
  TemplateVariable,
  TemplateOutput,
  CloudProvider,
  ResourceType,
  VariableType
} from '../types/infrastructure';

export interface ParsedTemplate {
  template: InfrastructureTemplate;
  resources: ResourceDefinition[];
  variables: Map<string, any>;
  outputs: TemplateOutput[];
  dependencies: Map<string, string[]>;
}

export class TemplateParser {
  private variableResolvers: Map<string, VariableResolver>;
  private resourceParsers: Map<ResourceType, ResourceParser>;

  constructor() {
    this.variableResolvers = new Map();
    this.resourceParsers = new Map();
    this.initializeResolvers();
    this.initializeParsers();
  }

  async parse(template: InfrastructureTemplate): Promise<ParsedTemplate> {
    try {
      // Resolve variables
      const resolvedVariables = await this.resolveVariables(template.variables);
      
      // Parse resources with resolved variables
      const parsedResources = await this.parseResources(template.resources, resolvedVariables);
      
      // Build dependency graph
      const dependencies = this.buildDependencyGraph(parsedResources);
      
      // Validate dependencies
      this.validateDependencies(dependencies);

      return {
        template,
        resources: parsedResources,
        variables: resolvedVariables,
        outputs: template.outputs,
        dependencies
      };

    } catch (error) {
      throw new Error(`Template parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateTemplate(state: InfrastructureState): Promise<InfrastructureTemplate> {
    try {
      // Generate resource definitions from state
      const resources = await this.generateResourceDefinitions(state.resources);
      
      // Generate variables from resource properties
      const variables = this.generateVariables(resources);
      
      // Generate outputs from resource outputs
      const outputs = this.generateOutputs(state.resources);

      return {
        id: `generated-${state.id}`,
        name: `Generated template for ${state.id}`,
        version: state.metadata.version,
        provider: this.detectProvider(resources),
        resources,
        variables,
        outputs,
        dependencies: [],
        metadata: {
          author: 'InfrastructureManager',
          description: `Generated from infrastructure state ${state.id}`,
          tags: ['generated', 'export'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: state.metadata.version
        }
      };

    } catch (error) {
      throw new Error(`Template generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async resolveVariables(variables: TemplateVariable[]): Promise<Map<string, any>> {
    const resolved = new Map<string, any>();

    for (const variable of variables) {
      try {
        const resolver = this.variableResolvers.get(variable.type);
        if (!resolver) {
          throw new Error(`No resolver found for variable type: ${variable.type}`);
        }

        const value = await resolver.resolve(variable);
        resolved.set(variable.name, value);

      } catch (error) {
        if (variable.required) {
          throw new Error(`Failed to resolve required variable ${variable.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Use default value for optional variables
        if (variable.defaultValue !== undefined) {
          resolved.set(variable.name, variable.defaultValue);
        }
      }
    }

    return resolved;
  }

  private async parseResources(
    resources: ResourceDefinition[], 
    variables: Map<string, any>
  ): Promise<ResourceDefinition[]> {
    const parsed: ResourceDefinition[] = [];

    for (const resource of resources) {
      try {
        const parser = this.resourceParsers.get(resource.type);
        if (!parser) {
          throw new Error(`No parser found for resource type: ${resource.type}`);
        }

        const parsedResource = await parser.parse(resource, variables);
        parsed.push(parsedResource);

      } catch (error) {
        throw new Error(`Failed to parse resource ${resource.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return parsed;
  }

  private buildDependencyGraph(resources: ResourceDefinition[]): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();

    for (const resource of resources) {
      dependencies.set(resource.name, resource.dependencies || []);
    }

    return dependencies;
  }

  private validateDependencies(dependencies: Map<string, string[]>): void {
    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const [resource] of dependencies) {
      if (!visited.has(resource)) {
        if (this.hasCyclicDependency(resource, dependencies, visited, recursionStack)) {
          throw new Error(`Circular dependency detected involving resource: ${resource}`);
        }
      }
    }

    // Check for missing dependencies
    const resourceNames = new Set(dependencies.keys());
    for (const [resource, deps] of dependencies) {
      for (const dep of deps) {
        if (!resourceNames.has(dep)) {
          throw new Error(`Resource ${resource} depends on non-existent resource: ${dep}`);
        }
      }
    }
  }

  private hasCyclicDependency(
    resource: string,
    dependencies: Map<string, string[]>,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    visited.add(resource);
    recursionStack.add(resource);

    const deps = dependencies.get(resource) || [];
    for (const dep of deps) {
      if (!visited.has(dep)) {
        if (this.hasCyclicDependency(dep, dependencies, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(dep)) {
        return true;
      }
    }

    recursionStack.delete(resource);
    return false;
  }

  private async generateResourceDefinitions(resources: any[]): Promise<ResourceDefinition[]> {
    // Convert state resources back to resource definitions
    return resources.map(resource => ({
      type: resource.type,
      name: resource.name,
      properties: resource.properties,
      dependencies: [],
      lifecycle: {
        createBeforeDestroy: false,
        preventDestroy: false,
        ignoreChanges: [],
        replaceTriggeredBy: []
      },
      tags: {}
    }));
  }

  private generateVariables(_resources: ResourceDefinition[]): TemplateVariable[] {
    const variables: TemplateVariable[] = [];
    const commonProperties = ['region', 'environment', 'project'];

    for (const property of commonProperties) {
      variables.push({
        name: property,
        type: VariableType.STRING,
        description: `The ${property} for this infrastructure`,
        required: true
      });
    }

    return variables;
  }

  private generateOutputs(resources: any[]): TemplateOutput[] {
    const outputs: TemplateOutput[] = [];

    for (const resource of resources) {
      if (resource.outputs) {
        for (const [key, value] of Object.entries(resource.outputs)) {
          outputs.push({
            name: `${resource.name}_${key}`,
            value: String(value),
            description: `${key} output from ${resource.name}`
          });
        }
      }
    }

    return outputs;
  }

  private detectProvider(_resources: ResourceDefinition[]): CloudProvider {
    // Since we only support GCP, always return GCP
    return CloudProvider.GCP;
  }

  private initializeResolvers(): void {
    this.variableResolvers.set(VariableType.STRING, new StringVariableResolver());
    this.variableResolvers.set(VariableType.NUMBER, new NumberVariableResolver());
    this.variableResolvers.set(VariableType.BOOLEAN, new BooleanVariableResolver());
    this.variableResolvers.set(VariableType.LIST, new ListVariableResolver());
    this.variableResolvers.set(VariableType.MAP, new MapVariableResolver());
    this.variableResolvers.set(VariableType.OBJECT, new ObjectVariableResolver());
  }

  private initializeParsers(): void {
    this.resourceParsers.set(ResourceType.COMPUTE, new ComputeResourceParser());
    this.resourceParsers.set(ResourceType.STORAGE, new StorageResourceParser());
    this.resourceParsers.set(ResourceType.NETWORK, new NetworkResourceParser());
    this.resourceParsers.set(ResourceType.DATABASE, new DatabaseResourceParser());
    this.resourceParsers.set(ResourceType.LOAD_BALANCER, new LoadBalancerResourceParser());
  }
}

// Variable Resolvers
interface VariableResolver {
  resolve(variable: TemplateVariable): Promise<any>;
}

class StringVariableResolver implements VariableResolver {
  async resolve(variable: TemplateVariable): Promise<string> {
    if (variable.defaultValue !== undefined) {
      return String(variable.defaultValue);
    }
    
    // In a real implementation, this might fetch from environment variables,
    // configuration files, or prompt the user
    throw new Error(`No value provided for required string variable: ${variable.name}`);
  }
}

class NumberVariableResolver implements VariableResolver {
  async resolve(variable: TemplateVariable): Promise<number> {
    if (variable.defaultValue !== undefined) {
      return Number(variable.defaultValue);
    }
    
    throw new Error(`No value provided for required number variable: ${variable.name}`);
  }
}

class BooleanVariableResolver implements VariableResolver {
  async resolve(variable: TemplateVariable): Promise<boolean> {
    if (variable.defaultValue !== undefined) {
      return Boolean(variable.defaultValue);
    }
    
    throw new Error(`No value provided for required boolean variable: ${variable.name}`);
  }
}

class ListVariableResolver implements VariableResolver {
  async resolve(variable: TemplateVariable): Promise<any[]> {
    if (variable.defaultValue !== undefined) {
      return Array.isArray(variable.defaultValue) ? variable.defaultValue : [variable.defaultValue];
    }
    
    throw new Error(`No value provided for required list variable: ${variable.name}`);
  }
}

class MapVariableResolver implements VariableResolver {
  async resolve(variable: TemplateVariable): Promise<Record<string, any>> {
    if (variable.defaultValue !== undefined) {
      return typeof variable.defaultValue === 'object' ? variable.defaultValue : {};
    }
    
    throw new Error(`No value provided for required map variable: ${variable.name}`);
  }
}

class ObjectVariableResolver implements VariableResolver {
  async resolve(variable: TemplateVariable): Promise<any> {
    if (variable.defaultValue !== undefined) {
      return variable.defaultValue;
    }
    
    throw new Error(`No value provided for required object variable: ${variable.name}`);
  }
}

// Resource Parsers
interface ResourceParser {
  parse(resource: ResourceDefinition, variables: Map<string, any>): Promise<ResourceDefinition>;
}

class ComputeResourceParser implements ResourceParser {
  async parse(resource: ResourceDefinition, _variables: Map<string, any>): Promise<ResourceDefinition> {
    // Parse compute-specific properties
    const parsedResource = { ...resource };
    
    // Substitute variables in properties
    parsedResource.properties = this.substituteVariables(resource.properties, _variables);
    
    return parsedResource;
  }

  private substituteVariables(properties: any, variables: Map<string, any>): any {
    const substituted = { ...properties };
    
    for (const [key, value] of Object.entries(substituted)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const varName = value.slice(2, -1);
        if (variables.has(varName)) {
          substituted[key] = variables.get(varName);
        }
      }
    }
    
    return substituted;
  }
}

class StorageResourceParser implements ResourceParser {
  async parse(resource: ResourceDefinition, _variables: Map<string, any>): Promise<ResourceDefinition> {
    return { ...resource };
  }
}

class NetworkResourceParser implements ResourceParser {
  async parse(resource: ResourceDefinition, _variables: Map<string, any>): Promise<ResourceDefinition> {
    return { ...resource };
  }
}

class DatabaseResourceParser implements ResourceParser {
  async parse(resource: ResourceDefinition, _variables: Map<string, any>): Promise<ResourceDefinition> {
    return { ...resource };
  }
}

class LoadBalancerResourceParser implements ResourceParser {
  async parse(resource: ResourceDefinition, _variables: Map<string, any>): Promise<ResourceDefinition> {
    return { ...resource };
  }
}