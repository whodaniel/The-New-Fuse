# Workflow Node Extension Example

This example demonstrates how to create a custom workflow node extension that integrates with The New Fuse workflow engine. We'll build a **Data Validator Node** that validates and transforms data as it flows through workflows.

## Overview

The Data Validator Node will:
- Validate input data against configurable schemas
- Transform data based on validation rules
- Provide detailed error reporting for invalid data
- Support multiple validation types (required fields, data types, ranges, etc.)

## Prerequisites

- The New Fuse platform installed and running
- Node.js 18+ or Bun runtime
- Basic understanding of JSON Schema validation
- Familiarity with TypeScript

## Project Structure

```
data-validator-node/
├── extension.json          # Extension manifest
├── src/
│   ├── index.ts           # Main extension implementation
│   ├── validator.ts       # Validation logic
│   └── types.ts           # Type definitions
├── tests/
│   └── validator.test.ts  # Unit tests
├── package.json
└── tsconfig.json
```

## Implementation

### 1. Extension Manifest

Create `extension.json`:

```json
{
  "name": "@examples/data-validator-node",
  "version": "1.0.0",
  "description": "Workflow node for data validation and transformation",
  "type": "workflow_node",
  "category": "data_processing",
  "main": "dist/index.js",
  "author": "The New Fuse Examples",
  "license": "MIT",
  "keywords": ["validation", "data", "workflow", "schema"],
  "permissions": [
    "workflow_modify"
  ],
  "configuration": {
    "schema": {
      "type": "object",
      "properties": {
        "validationSchema": {
          "type": "object",
          "description": "JSON Schema for data validation",
          "default": {
            "type": "object",
            "required": ["id", "name"],
            "properties": {
              "id": { "type": "string" },
              "name": { "type": "string" }
            }
          }
        },
        "strictMode": {
          "type": "boolean",
          "default": true,
          "description": "Fail on validation errors or continue with warnings"
        },
        "transformations": {
          "type": "array",
          "description": "Data transformations to apply",
          "items": {
            "type": "object",
            "properties": {
              "field": { "type": "string" },
              "operation": { 
                "type": "string", 
                "enum": ["trim", "lowercase", "uppercase", "sanitize"] 
              }
            }
          },
          "default": []
        }
      }
    }
  },
  "dependencies": {
    "@the-new-fuse/workflow-engine": "^1.0.0",
    "ajv": "^8.12.0"
  }
}
```

### 2. Type Definitions

Create `src/types.ts`:

```typescript
export interface ValidationConfig {
  validationSchema: Record<string, any>;
  strictMode: boolean;
  transformations: Transformation[];
}

export interface Transformation {
  field: string;
  operation: 'trim' | 'lowercase' | 'uppercase' | 'sanitize';
}

export interface ValidationInput {
  data: any;
  metadata?: Record<string, any>;
}

export interface ValidationOutput {
  valid: boolean;
  data: any;
  originalData: any;
  errors: ValidationError[];
  warnings: ValidationError[];
  transformationsApplied: string[];
  metadata?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
  rule: string;
}
```

### 3. Validation Logic

Create `src/validator.ts`:

```typescript
import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import { ValidationConfig, ValidationError, Transformation } from './types';

export class DataValidator {
  private ajv: Ajv;
  private validateFunction: ValidateFunction<any> | null = null;

  constructor() {
    this.ajv = new Ajv({ 
      allErrors: true,
      removeAdditional: false,
      useDefaults: true,
      coerceTypes: true
    });
  }

  /**
   * Set validation schema
   */
  setSchema(schema: Record<string, any>): void {
    try {
      this.validateFunction = this.ajv.compile(schema);
    } catch (error) {
      throw new Error(`Invalid validation schema: ${error.message}`);
    }
  }

  /**
   * Validate data against schema
   */
  validate(data: any): { valid: boolean; errors: ValidationError[] } {
    if (!this.validateFunction) {
      throw new Error('Validation schema not set');
    }

    const valid = this.validateFunction(data);
    const errors: ValidationError[] = [];

    if (!valid && this.validateFunction.errors) {
      for (const error of this.validateFunction.errors) {
        errors.push({
          field: error.instancePath || error.schemaPath,
          message: error.message || 'Validation failed',
          value: error.data,
          rule: error.keyword || 'unknown'
        });
      }
    }

    return { valid, errors };
  }

  /**
   * Apply data transformations
   */
  applyTransformations(data: any, transformations: Transformation[]): {
    data: any;
    applied: string[];
  } {
    const applied: string[] = [];
    const transformedData = JSON.parse(JSON.stringify(data)); // Deep clone

    for (const transformation of transformations) {
      const { field, operation } = transformation;
      
      if (this.hasField(transformedData, field)) {
        const value = this.getFieldValue(transformedData, field);
        
        if (typeof value === 'string') {
          const transformedValue = this.applyStringTransformation(value, operation);
          this.setFieldValue(transformedData, field, transformedValue);
          applied.push(`${operation} on ${field}`);
        }
      }
    }

    return { data: transformedData, applied };
  }

  private applyStringTransformation(value: string, operation: string): string {
    switch (operation) {
      case 'trim':
        return value.trim();
      case 'lowercase':
        return value.toLowerCase();
      case 'uppercase':
        return value.toUpperCase();
      case 'sanitize':
        return value.replace(/[<>\"'&]/g, ''); // Basic sanitization
      default:
        return value;
    }
  }

  private hasField(obj: any, field: string): boolean {
    return field.split('.').reduce((current, key) => {
      return current && current[key] !== undefined;
    }, obj) !== undefined;
  }

  private getFieldValue(obj: any, field: string): any {
    return field.split('.').reduce((current, key) => {
      return current ? current[key] : undefined;
    }, obj);
  }

  private setFieldValue(obj: any, field: string, value: any): void {
    const keys = field.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}
```

### 4. Main Extension Implementation

Create `src/index.ts`:

```typescript
import { 
  ExtensionLifecycle, 
  ExtensionContext,
  WorkflowNode 
} from '@the-new-fuse/extension-system/types';
import { DataValidator } from './validator';
import { 
  ValidationConfig, 
  ValidationInput, 
  ValidationOutput,
  ValidationError 
} from './types';

export class DataValidatorNode implements ExtensionLifecycle, WorkflowNode {
  private config: ValidationConfig;
  private context: ExtensionContext;
  private validator: DataValidator;

  constructor() {
    this.validator = new DataValidator();
    this.config = {
      validationSchema: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      },
      strictMode: true,
      transformations: []
    };
  }

  /**
   * Extension Lifecycle: Called when extension is loaded
   */
  async onLoad(context: ExtensionContext): Promise<void> {
    this.context = context;
    this.config = { ...this.config, ...context.getConfig() };
    
    try {
      this.validator.setSchema(this.config.validationSchema);
      context.logger?.info('DataValidatorNode extension loaded successfully');
    } catch (error) {
      context.logger?.error(`Failed to load DataValidatorNode: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extension Lifecycle: Called when configuration changes
   */
  async onConfigChange(
    config: Record<string, any>, 
    context: ExtensionContext
  ): Promise<void> {
    const newConfig = { ...this.config, ...config } as ValidationConfig;
    
    try {
      // Validate the new schema
      this.validator.setSchema(newConfig.validationSchema);
      this.config = newConfig;
      
      context.logger?.info('DataValidatorNode configuration updated');
    } catch (error) {
      context.logger?.error(`Invalid configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Workflow Node: Main processing method
   */
  async execute(
    input: ValidationInput, 
    context: any
  ): Promise<ValidationOutput> {
    const { data, metadata } = input;
    const startTime = Date.now();

    try {
      // Apply transformations first
      const transformationResult = this.validator.applyTransformations(
        data, 
        this.config.transformations
      );

      // Validate the transformed data
      const validationResult = this.validator.validate(transformationResult.data);

      // Determine if processing should continue
      const shouldContinue = validationResult.valid || !this.config.strictMode;

      // Log validation results
      if (validationResult.valid) {
        this.context.logger?.debug(
          `Data validation passed for ${JSON.stringify(data)}`
        );
      } else {
        const errorMessage = `Data validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`;
        
        if (this.config.strictMode) {
          this.context.logger?.error(errorMessage);
        } else {
          this.context.logger?.warn(errorMessage);
        }
      }

      // Log performance
      const processingTime = Date.now() - startTime;
      this.context.logger?.debug(`Validation completed in ${processingTime}ms`);

      const result: ValidationOutput = {
        valid: validationResult.valid,
        data: shouldContinue ? transformationResult.data : data,
        originalData: data,
        errors: this.config.strictMode ? validationResult.errors : [],
        warnings: !this.config.strictMode ? validationResult.errors : [],
        transformationsApplied: transformationResult.applied,
        metadata: {
          ...metadata,
          validationTime: processingTime,
          validationTimestamp: new Date().toISOString()
        }
      };

      // In strict mode, throw error if validation fails
      if (!validationResult.valid && this.config.strictMode) {
        throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }

      return result;

    } catch (error) {
      this.context.logger?.error(`DataValidatorNode execution failed: ${error.message}`);
      
      // Return error result
      return {
        valid: false,
        data: data,
        originalData: data,
        errors: [{
          field: 'execution',
          message: error.message,
          value: data,
          rule: 'execution_error'
        }],
        warnings: [],
        transformationsApplied: [],
        metadata
      };
    }
  }

  /**
   * Extension Lifecycle: Called when extension is activated
   */
  async onActivate(context: ExtensionContext): Promise<void> {
    context.logger?.info('DataValidatorNode extension activated');
  }

  /**
   * Extension Lifecycle: Called when extension is deactivated
   */
  async onDeactivate(context: ExtensionContext): Promise<void> {
    context.logger?.info('DataValidatorNode extension deactivated');
  }

  /**
   * Extension Lifecycle: Called when extension is unloaded
   */
  async onUnload(context: ExtensionContext): Promise<void> {
    context.logger?.info('DataValidatorNode extension unloaded');
  }

  /**
   * Extension Lifecycle: Called when an error occurs
   */
  async onError(error: Error, context: ExtensionContext): Promise<void> {
    context.logger?.error(`DataValidatorNode error: ${error.message}`);
  }

  /**
   * Get current validation statistics
   */
  getValidationStats(): Record<string, any> {
    return {
      schemaFields: Object.keys(this.config.validationSchema.properties || {}),
      requiredFields: this.config.validationSchema.required || [],
      transformationCount: this.config.transformations.length,
      strictMode: this.config.strictMode
    };
  }
}

// Export the extension class as default
export default DataValidatorNode;
```

### 5. Unit Tests

Create `tests/validator.test.ts`:

```typescript
import { DataValidator } from '../src/validator';
import { ValidationConfig } from '../src/types';

describe('DataValidator', () => {
  let validator: DataValidator;

  beforeEach(() => {
    validator = new DataValidator();
  });

  describe('Schema Validation', () => {
    it('should validate data against schema', () => {
      const schema = {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' }
        }
      };

      validator.setSchema(schema);

      const validData = { name: 'John Doe', email: 'john@example.com' };
      const result = validator.validate(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid data', () => {
      const schema = {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' }
        }
      };

      validator.setSchema(schema);

      const invalidData = { age: 25 }; // missing required 'name'
      const result = validator.validate(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toContain('name');
    });
  });

  describe('Data Transformations', () => {
    it('should apply string transformations', () => {
      const data = { name: '  John Doe  ', email: 'JOHN@EXAMPLE.COM' };
      const transformations = [
        { field: 'name', operation: 'trim' as const },
        { field: 'email', operation: 'lowercase' as const }
      ];

      const result = validator.applyTransformations(data, transformations);

      expect(result.data.name).toBe('John Doe');
      expect(result.data.email).toBe('john@example.com');
      expect(result.applied).toContain('trim on name');
      expect(result.applied).toContain('lowercase on email');
    });

    it('should handle nested field transformations', () => {
      const data = { user: { profile: { name: '  JOHN  ' } } };
      const transformations = [
        { field: 'user.profile.name', operation: 'trim' as const },
        { field: 'user.profile.name', operation: 'lowercase' as const }
      ];

      const result = validator.applyTransformations(data, transformations);

      expect(result.data.user.profile.name).toBe('john');
    });
  });
});
```

## Usage Examples

### 1. Basic Usage

```typescript
import { ExtensionSystemFactory } from '@the-new-fuse/extension-system';

const extensionManager = ExtensionSystemFactory.createDefault('./extensions', logger);
await extensionManager.initialize();

// Load the data validator extension
const result = await extensionManager.loadExtension('./data-validator-node');
await extensionManager.activateExtension(result.extension.id);

// Test the validator
const extension = extensionManager.getExtension('@examples/data-validator-node@1.0.0');
const testData = {
  data: { id: '123', name: 'Test User', email: 'test@example.com' },
  metadata: { source: 'api' }
};

const validationResult = await extension.instance.execute(testData, {});
console.log('Validation result:', validationResult);
```

### 2. Custom Configuration

```typescript
// Configure the validator with custom schema and transformations
await extensionManager.setExtensionConfig('@examples/data-validator-node@1.0.0', {
  validationSchema: {
    type: 'object',
    required: ['userId', 'email', 'profile'],
    properties: {
      userId: { type: 'string', pattern: '^[0-9]+$' },
      email: { type: 'string', format: 'email' },
      profile: {
        type: 'object',
        required: ['firstName', 'lastName'],
        properties: {
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
          age: { type: 'integer', minimum: 0, maximum: 150 }
        }
      }
    }
  },
  strictMode: false, // Continue processing with warnings
  transformations: [
    { field: 'email', operation: 'lowercase' },
    { field: 'profile.firstName', operation: 'trim' },
    { field: 'profile.lastName', operation: 'trim' }
  ]
});
```

### 3. Workflow Integration

```typescript
// Example workflow that uses the data validator
const workflowDefinition = {
  id: 'user-registration-workflow',
  name: 'User Registration with Validation',
  nodes: [
    {
      id: 'input',
      type: 'input',
      config: {}
    },
    {
      id: 'validate-user-data',
      type: '@examples/data-validator-node',
      config: {
        validationSchema: {
          type: 'object',
          required: ['email', 'password', 'profile'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            profile: {
              type: 'object',
              required: ['firstName', 'lastName'],
              properties: {
                firstName: { type: 'string', minLength: 1 },
                lastName: { type: 'string', minLength: 1 }
              }
            }
          }
        },
        transformations: [
          { field: 'email', operation: 'lowercase' },
          { field: 'profile.firstName', operation: 'trim' },
          { field: 'profile.lastName', operation: 'trim' }
        ],
        strictMode: true
      }
    },
    {
      id: 'save-user',
      type: 'database-save',
      config: {
        table: 'users'
      }
    }
  ],
  connections: [
    { from: 'input', to: 'validate-user-data' },
    { from: 'validate-user-data', to: 'save-user' }
  ]
};
```

## Advanced Features

### 1. Custom Validation Rules

Extend the validator with custom validation rules:

```typescript
// In validator.ts, add custom keywords
this.ajv.addKeyword({
  keyword: 'isValidUsername',
  type: 'string',
  schemaType: 'boolean',
  compile: (schemaVal) => {
    return function validate(data) {
      if (!schemaVal) return true;
      return /^[a-zA-Z0-9_]{3,20}$/.test(data);
    };
  }
});
```

### 2. Async Validation

Add support for async validation (e.g., checking if email exists):

```typescript
async validateAsync(data: any): Promise<{ valid: boolean; errors: ValidationError[] }> {
  // Perform async validations
  const asyncErrors: ValidationError[] = [];
  
  if (data.email) {
    const emailExists = await this.checkEmailExists(data.email);
    if (emailExists) {
      asyncErrors.push({
        field: 'email',
        message: 'Email already exists',
        value: data.email,
        rule: 'unique'
      });
    }
  }
  
  return { valid: asyncErrors.length === 0, errors: asyncErrors };
}
```

### 3. Performance Monitoring

Add performance monitoring and caching:

```typescript
private validationCache = new Map<string, any>();

async execute(input: ValidationInput, context: any): Promise<ValidationOutput> {
  const cacheKey = JSON.stringify(input.data);
  
  if (this.validationCache.has(cacheKey)) {
    this.context.logger?.debug('Using cached validation result');
    return this.validationCache.get(cacheKey);
  }
  
  const result = await this.performValidation(input, context);
  this.validationCache.set(cacheKey, result);
  
  return result;
}
```

## Testing the Extension

### 1. Build and Test

```bash
# Install dependencies
pnpm install

# Build the extension
pnpm run build

# Run tests
pnpm test

# Test with different data
pnpm run test:integration
```

### 2. Integration Testing

Create integration tests that load the extension in a real environment:

```typescript
// tests/integration.test.ts
import { ExtensionSystemFactory } from '@the-new-fuse/extension-system';

describe('DataValidatorNode Integration', () => {
  let extensionManager;
  
  beforeAll(async () => {
    extensionManager = ExtensionSystemFactory.createDefault('./dist', logger);
    await extensionManager.initialize();
    
    const result = await extensionManager.loadExtension('./');
    await extensionManager.activateExtension(result.extension.id);
  });
  
  it('should validate data in workflow context', async () => {
    // Test the extension in a workflow-like environment
    const extension = extensionManager.getExtension('@examples/data-validator-node@1.0.0');
    
    const input = {
      data: { id: '123', name: 'Test User' },
      metadata: { workflowId: 'test-workflow' }
    };
    
    const result = await extension.instance.execute(input, {});
    
    expect(result.valid).toBe(true);
    expect(result.data).toEqual(input.data);
  });
});
```

## Next Steps

This example demonstrates the core concepts of creating workflow node extensions. You can extend this further by:

1. **Adding more validation types** - Date validation, custom business rules, etc.
2. **Implementing caching** - Cache validation results for better performance
3. **Adding metrics** - Track validation success rates and performance
4. **Creating a UI** - Build a configuration interface for the validation rules
5. **Publishing** - Share your extension with the community

For more advanced examples, see:
- **[Agent Capability Example](agent-capability-example.md)** - Add skills to AI agents
- **[NestJS Module Example](nestjs-module-example.md)** - Backend service integration

## Troubleshooting

### Common Issues

1. **Schema compilation errors** - Ensure your JSON schema is valid
2. **Type errors** - Check that your TypeScript types match the expected interfaces
3. **Performance issues** - Consider caching and async validation patterns
4. **Memory leaks** - Clean up resources in the `onUnload` lifecycle method

### Debug Tips

- Enable debug logging to see validation details
- Use the extension's `getValidationStats()` method to monitor performance
- Test with various data types and edge cases
- Validate your extension manifest before loading