/**
 * Infrastructure Manager Tests
 * Tests for the core infrastructure management functionality
 */

import { createLogger } from 'winston';
import { MetricsCollector } from '../core/MetricsCollector';
import {
  CloudProvider,
  InfrastructureTemplate,
  InfrastructureUpdate,
  ResourceType,
  VariableType,
} from '../types/infrastructure';
import { ChangeAnalyzer } from './ChangeAnalyzer';
import { InfrastructureManager } from './InfrastructureManager';
import { ResourceProvisioner } from './ResourceProvisioner';
import { InMemoryStateStorage, StateManager } from './StateManager';
import { TemplateParser } from './TemplateParser';
import { TemplateValidator } from './TemplateValidator';

describe('InfrastructureManager', () => {
  let infrastructureManager: InfrastructureManager;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = createLogger({ silent: true });

    const templateParser = new TemplateParser();
    const stateManager = new StateManager(new InMemoryStateStorage());
    const resourceProvisioner = new ResourceProvisioner();
    const templateValidator = new TemplateValidator();
    const changeAnalyzer = new ChangeAnalyzer();
    const metricsCollector = new MetricsCollector(mockLogger);

    infrastructureManager = new InfrastructureManager(
      templateParser,
      stateManager,
      resourceProvisioner,
      templateValidator,
      changeAnalyzer,
      metricsCollector
    );
  });

  describe('provisionInfrastructure', () => {
    it('should provision infrastructure from a valid template', async () => {
      const template: InfrastructureTemplate = {
        id: 'test-template',
        name: 'Test Infrastructure',
        version: '1.0.0',
        provider: CloudProvider.GCP,
        resources: [
          {
            type: ResourceType.COMPUTE_ENGINE,
            name: 'web-server',
            properties: {
              cpu: '500m',
              memory: '1Gi',
              replicas: 2,
            },
            dependencies: [],
            lifecycle: {
              createBeforeDestroy: false,
              preventDestroy: false,
              ignoreChanges: [],
              replaceTriggeredBy: [],
            },
            tags: {
              environment: 'test',
              component: 'web',
            },
          },
        ],
        variables: [
          {
            name: 'environment',
            type: VariableType.STRING,
            description: 'Environment name',
            defaultValue: 'test',
            required: true,
          },
        ],
        outputs: [
          {
            name: 'web_server_endpoint',
            value: '${web-server.endpoint}',
            description: 'Web server endpoint URL',
          },
        ],
        dependencies: [],
        metadata: {
          author: 'test',
          description: 'Test infrastructure template',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
        },
      };

      const result = await infrastructureManager.provisionInfrastructure(template);

      expect(result.success).toBe(true);
      expect(result.infrastructureId).toBeDefined();
      expect(result.resources).toHaveLength(1);
      expect(result.resources[0].resourceName).toBe('web-server');
      expect(result.resources[0].resourceType).toBe(ResourceType.COMPUTE_ENGINE);
      expect(result.resources[0].success).toBe(true);
    });

    it('should fail provisioning with invalid template', async () => {
      const invalidTemplate: InfrastructureTemplate = {
        id: '',
        name: '',
        version: '',
        provider: CloudProvider.GCP,
        resources: [],
        variables: [],
        outputs: [],
        dependencies: [],
        metadata: {
          author: '',
          description: '',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '',
        },
      };

      const result = await infrastructureManager.provisionInfrastructure(invalidTemplate);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Template validation failed');
    });
  });

  describe('validateTemplate', () => {
    it('should validate a correct template', async () => {
      const template: InfrastructureTemplate = {
        id: 'valid-template',
        name: 'Valid Template',
        version: '1.0.0',
        provider: CloudProvider.GCP,
        resources: [
          {
            type: ResourceType.COMPUTE_ENGINE,
            name: 'valid-resource',
            properties: {},
            dependencies: [],
            lifecycle: {
              createBeforeDestroy: false,
              preventDestroy: false,
              ignoreChanges: [],
              replaceTriggeredBy: [],
            },
            tags: {
              environment: 'test',
            },
          },
        ],
        variables: [],
        outputs: [],
        dependencies: [],
        metadata: {
          author: 'test',
          description: 'Valid template',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
        },
      };

      const result = await infrastructureManager.validateTemplate(template);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors in invalid template', async () => {
      const invalidTemplate: InfrastructureTemplate = {
        id: '',
        name: '',
        version: '',
        provider: CloudProvider.GCP,
        resources: [
          {
            type: ResourceType.COMPUTE_ENGINE,
            name: '',
            properties: {},
            dependencies: [],
            lifecycle: {
              createBeforeDestroy: false,
              preventDestroy: false,
              ignoreChanges: [],
              replaceTriggeredBy: [],
            },
            tags: {},
          },
        ],
        variables: [],
        outputs: [],
        dependencies: [],
        metadata: {
          author: '',
          description: '',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '',
        },
      };

      const result = await infrastructureManager.validateTemplate(invalidTemplate);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('updateInfrastructure', () => {
    it('should update existing infrastructure', async () => {
      // First provision infrastructure
      const template: InfrastructureTemplate = {
        id: 'update-test-template',
        name: 'Update Test Infrastructure',
        version: '1.0.0',
        provider: CloudProvider.GCP,
        resources: [
          {
            type: ResourceType.COMPUTE_ENGINE,
            name: 'web-server',
            properties: {
              machineType: 'e2-medium',
              diskSize: 20,
            },
            dependencies: [],
            lifecycle: {
              createBeforeDestroy: false,
              preventDestroy: false,
              ignoreChanges: [],
              replaceTriggeredBy: [],
            },
            tags: {
              environment: 'test',
            },
          },
        ],
        variables: [],
        outputs: [],
        dependencies: [],
        metadata: {
          author: 'test',
          description: 'Test infrastructure for updates',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
        },
      };

      const provisionResult = await infrastructureManager.provisionInfrastructure(template);
      expect(provisionResult.success).toBe(true);

      // Now update the infrastructure
      const update: InfrastructureUpdate = {
        infrastructureId: provisionResult.infrastructureId,
        variableChanges: {
          replicas: 2,
        },
        reason: 'Scale up replicas',
      };

      const updateResult = await infrastructureManager.updateInfrastructure(update);

      if (!updateResult.success) {
      }

      expect(updateResult.success).toBe(true);
      expect(updateResult.infrastructureId).toBe(provisionResult.infrastructureId);
    });
  });

  describe('destroyInfrastructure', () => {
    it('should destroy existing infrastructure', async () => {
      // First provision infrastructure
      const template: InfrastructureTemplate = {
        id: 'destroy-test-template',
        name: 'Destroy Test Infrastructure',
        version: '1.0.0',
        provider: CloudProvider.GCP,
        resources: [
          {
            type: ResourceType.COMPUTE_ENGINE,
            name: 'web-server',
            properties: {
              machineType: 'e2-medium',
            },
            dependencies: [],
            lifecycle: {
              createBeforeDestroy: false,
              preventDestroy: false,
              ignoreChanges: [],
              replaceTriggeredBy: [],
            },
            tags: {},
          },
        ],
        variables: [],
        outputs: [],
        dependencies: [],
        metadata: {
          author: 'test',
          description: 'Test infrastructure for destruction',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
        },
      };

      const provisionResult = await infrastructureManager.provisionInfrastructure(template);
      expect(provisionResult.success).toBe(true);

      // Now destroy the infrastructure
      const destroyResult = await infrastructureManager.destroyInfrastructure(
        provisionResult.infrastructureId
      );

      expect(destroyResult.success).toBe(true);
      expect(destroyResult.infrastructureId).toBe(provisionResult.infrastructureId);
      expect(destroyResult.resourcesDestroyed).toContain('web-server');
    });
  });

  describe('getInfrastructureState', () => {
    it('should retrieve infrastructure state', async () => {
      // First provision infrastructure
      const template: InfrastructureTemplate = {
        id: 'state-test-template',
        name: 'State Test Infrastructure',
        version: '1.0.0',
        provider: CloudProvider.GCP,
        resources: [
          {
            type: ResourceType.COMPUTE_ENGINE,
            name: 'web-server',
            properties: {},
            dependencies: [],
            lifecycle: {
              createBeforeDestroy: false,
              preventDestroy: false,
              ignoreChanges: [],
              replaceTriggeredBy: [],
            },
            tags: {},
          },
        ],
        variables: [],
        outputs: [],
        dependencies: [],
        metadata: {
          author: 'test',
          description: 'Test infrastructure for state retrieval',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
        },
      };

      const provisionResult = await infrastructureManager.provisionInfrastructure(template);
      expect(provisionResult.success).toBe(true);

      // Retrieve the state
      const state = await infrastructureManager.getInfrastructureState(
        provisionResult.infrastructureId
      );

      expect(state.id).toBe(provisionResult.infrastructureId);
      expect(state.templateId).toBe(template.id);
      expect(state.resources).toHaveLength(1);
      expect(state.resources[0].name).toBe('web-server');
    });

    it('should throw error for non-existent infrastructure', async () => {
      await expect(infrastructureManager.getInfrastructureState('non-existent-id')).rejects.toThrow(
        'Infrastructure non-existent-id not found'
      );
    });
  });

  describe('listInfrastructure', () => {
    it('should list all infrastructure instances', async () => {
      // Provision multiple infrastructure instances
      const template1: InfrastructureTemplate = {
        id: 'list-test-template-1',
        name: 'List Test Infrastructure 1',
        version: '1.0.0',
        provider: CloudProvider.GCP,
        resources: [],
        variables: [],
        outputs: [],
        dependencies: [],
        metadata: {
          author: 'test',
          description: 'Test infrastructure 1',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
        },
      };

      const template2: InfrastructureTemplate = {
        id: 'list-test-template-2',
        name: 'List Test Infrastructure 2',
        version: '1.0.0',
        provider: CloudProvider.GCP,
        resources: [],
        variables: [],
        outputs: [],
        dependencies: [],
        metadata: {
          author: 'test',
          description: 'Test infrastructure 2',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
        },
      };

      await infrastructureManager.provisionInfrastructure(template1);
      await infrastructureManager.provisionInfrastructure(template2);

      const allInfrastructure = await infrastructureManager.listInfrastructure();
      expect(allInfrastructure.length).toBeGreaterThanOrEqual(2);

      // Test filtering by provider
      const gcpInfrastructure = await infrastructureManager.listInfrastructure({
        provider: CloudProvider.GCP,
      });
      expect(gcpInfrastructure.length).toBeGreaterThanOrEqual(2);
    });
  });
});
