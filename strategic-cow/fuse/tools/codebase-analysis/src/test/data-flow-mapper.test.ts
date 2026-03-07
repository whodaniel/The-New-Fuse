import { describe, it, expect, beforeEach } from 'vitest';
import { DataFlowMapper } from '../analyzer/DataFlowMapper';
import type { PackageInfo } from '../scanner/FileSystemScanner';

describe('DataFlowMapper', () => {
  let mapper: DataFlowMapper;
  let mockPackages: PackageInfo[];

  beforeEach(() => {
    mockPackages = [
      {
        name: 'test-package',
        path: '/test/packages/test-package',
        type: 'package',
        packageJson: {
          name: 'test-package',
          version: '1.0.0',
          dependencies: {}
        },
        files: [],
        dependencies: [],
        exports: [],
        hasImplementation: true,
        isStub: false
      }
    ];
    
    mapper = new DataFlowMapper(mockPackages, '/test');
  });

  describe('mapDataFlow', () => {
    it('should map data flow successfully', async () => {
      expect(mapper).toBeDefined();
      expect(typeof mapper.mapDataFlow).toBe('function');
    });
  });

  describe('determineNodeType', () => {
    it('should identify frontend components', () => {
      const determineNodeTypeMethod = (mapper as any).determineNodeType.bind(mapper);
      
      const frontendContent = 'import React, { useState } from "react";';
      const result = determineNodeTypeMethod('src/components/UserProfile.tsx', frontendContent);
      
      expect(result).toBe('frontend');
    });

    it('should identify API controllers', () => {
      const determineNodeTypeMethod = (mapper as any).determineNodeType.bind(mapper);
      
      const controllerContent = '@Controller("users") export class UserController';
      const result = determineNodeTypeMethod('src/controllers/UserController.ts', controllerContent);
      
      expect(result).toBe('controller');
    });

    it('should identify services', () => {
      const determineNodeTypeMethod = (mapper as any).determineNodeType.bind(mapper);
      
      const serviceContent = '@Service() export class UserService';
      const result = determineNodeTypeMethod('src/services/UserService.ts', serviceContent);
      
      expect(result).toBe('service');
    });

    it('should identify repositories', () => {
      const determineNodeTypeMethod = (mapper as any).determineNodeType.bind(mapper);
      
      const repositoryContent = 'await drizzle.user.findMany()';
      const result = determineNodeTypeMethod('src/repositories/UserRepository.ts', repositoryContent);
      
      expect(result).toBe('repository');
    });

    it('should return null for unrecognized files', () => {
      const determineNodeTypeMethod = (mapper as any).determineNodeType.bind(mapper);
      
      const result = determineNodeTypeMethod('src/utils/helper.ts', 'export const helper = () => {}');
      
      expect(result).toBeNull();
    });
  });

  describe('determineLayer', () => {
    it('should map frontend to presentation layer', () => {
      const determineLayerMethod = (mapper as any).determineLayer.bind(mapper);
      
      const result = determineLayerMethod('frontend');
      expect(result).toBe('presentation');
    });

    it('should map controller to api layer', () => {
      const determineLayerMethod = (mapper as any).determineLayer.bind(mapper);
      
      const result = determineLayerMethod('controller');
      expect(result).toBe('api');
    });

    it('should map service to business layer', () => {
      const determineLayerMethod = (mapper as any).determineLayer.bind(mapper);
      
      const result = determineLayerMethod('service');
      expect(result).toBe('business');
    });

    it('should map repository to data layer', () => {
      const determineLayerMethod = (mapper as any).determineLayer.bind(mapper);
      
      const result = determineLayerMethod('repository');
      expect(result).toBe('data');
    });
  });

  describe('extractApiMethod', () => {
    it('should extract GET endpoint', () => {
      const extractApiMethodMethod = (mapper as any).extractApiMethod.bind(mapper);
      
      const line = '@Get("/users")';
      const lines = [line, 'async getUsers() {'];
      const result = extractApiMethodMethod(line, lines, 0);
      
      expect(result).toBeTruthy();
      expect(result?.type).toBe('endpoint');
    });

    it('should extract POST endpoint', () => {
      const extractApiMethodMethod = (mapper as any).extractApiMethod.bind(mapper);
      
      const line = '@Post("/users")';
      const lines = [line, 'async createUser() {'];
      const result = extractApiMethodMethod(line, lines, 0);
      
      expect(result).toBeTruthy();
      expect(result?.type).toBe('endpoint');
    });

    it('should return null for non-endpoint lines', () => {
      const extractApiMethodMethod = (mapper as any).extractApiMethod.bind(mapper);
      
      const line = 'const helper = () => {}';
      const lines = [line];
      const result = extractApiMethodMethod(line, lines, 0);
      
      expect(result).toBeNull();
    });
  });

  describe('extractTransformations', () => {
    it('should identify mapping transformations', () => {
      const extractTransformationsMethod = (mapper as any).extractTransformations.bind(mapper);
      
      const lines = [
        'const users = data.map(user => ({',
        '  id: user.id,',
        '  name: user.name',
        '}))'
      ];
      
      const result = extractTransformationsMethod(lines, 0);
      
      expect(result).toHaveLength(1);
      expect(result[0].transformationType).toBe('mapping');
    });

    it('should identify validation transformations', () => {
      const extractTransformationsMethod = (mapper as any).extractTransformations.bind(mapper);
      
      const lines = [
        'const validatedData = schema.validate(data);'
      ];
      
      const result = extractTransformationsMethod(lines, 0);
      
      expect(result).toHaveLength(1);
      expect(result[0].transformationType).toBe('validation');
    });

    it('should identify serialization transformations', () => {
      const extractTransformationsMethod = (mapper as any).extractTransformations.bind(mapper);
      
      const lines = [
        'const jsonData = JSON.stringify(data);'
      ];
      
      const result = extractTransformationsMethod(lines, 0);
      
      expect(result).toHaveLength(1);
      expect(result[0].transformationType).toBe('serialization');
    });
  });

  describe('extractDatabaseOperations', () => {
    it('should extract Drizzle operations', () => {
      const extractDatabaseOperationsMethod = (mapper as any).extractDatabaseOperations.bind(mapper);
      
      const lines = [
        'const users = await drizzle.user.findMany({',
        '  where: { isActive: true }',
        '});'
      ];
      
      const result = extractDatabaseOperationsMethod(lines, 0);
      
      expect(result).toHaveLength(1);
      expect(result[0].model).toBe('user');
      expect(result[0].type).toBe('query');
    });

    it('should extract SQL operations', () => {
      const extractDatabaseOperationsMethod = (mapper as any).extractDatabaseOperations.bind(mapper);
      
      const lines = [
        'SELECT * FROM users WHERE active = true'
      ];
      
      const result = extractDatabaseOperationsMethod(lines, 0);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('query');
    });
  });

  describe('extractApiCalls', () => {
    it('should extract fetch calls', () => {
      const extractApiCallsMethod = (mapper as any).extractApiCalls.bind(mapper);
      
      const lines = [
        'const response = await fetch("/api/users");'
      ];
      
      const result = extractApiCallsMethod(lines, 0);
      
      expect(result).toHaveLength(1);
      expect(result[0].endpoint).toBe('/api/users');
      expect(result[0].method).toBe('GET');
    });

    it('should extract axios calls', () => {
      const extractApiCallsMethod = (mapper as any).extractApiCalls.bind(mapper);
      
      const lines = [
        'const response = await axios.post("/api/users", userData);'
      ];
      
      const result = extractApiCallsMethod(lines, 0);
      
      expect(result).toHaveLength(1);
      expect(result[0].endpoint).toBe('/api/users');
      expect(result[0].method).toBe('POST');
    });
  });

  describe('assessQueryPerformance', () => {
    it('should assess findMany without pagination as inefficient', () => {
      const assessQueryPerformanceMethod = (mapper as any).assessQueryPerformance.bind(mapper);
      
      const result = assessQueryPerformanceMethod('await drizzle.user.findMany()');
      expect(result).toBe('inefficient');
    });

    it('should assess findMany with include as moderate', () => {
      const assessQueryPerformanceMethod = (mapper as any).assessQueryPerformance.bind(mapper);
      
      const result = assessQueryPerformanceMethod('await drizzle.user.findMany({ include: { posts: true } })');
      expect(result).toBe('moderate');
    });

    it('should assess simple queries as efficient', () => {
      const assessQueryPerformanceMethod = (mapper as any).assessQueryPerformance.bind(mapper);
      
      const result = assessQueryPerformanceMethod('await drizzle.user.findUnique({ where: { id } })');
      expect(result).toBe('efficient');
    });
  });

  describe('assessPathPerformance', () => {
    it('should assess path with many inefficient transformations as inefficient', () => {
      const assessPathPerformanceMethod = (mapper as any).assessPathPerformance.bind(mapper);
      
      const transformations = [
        { efficiency: 'inefficient' },
        { efficiency: 'inefficient' },
        { efficiency: 'efficient' }
      ];
      
      const result = assessPathPerformanceMethod(transformations);
      expect(result).toBe('inefficient');
    });

    it('should assess path with some inefficient transformations as moderate', () => {
      const assessPathPerformanceMethod = (mapper as any).assessPathPerformance.bind(mapper);
      
      const transformations = [
        { efficiency: 'inefficient' },
        { efficiency: 'efficient' },
        { efficiency: 'efficient' },
        { efficiency: 'efficient' }
      ];
      
      const result = assessPathPerformanceMethod(transformations);
      expect(result).toBe('moderate');
    });

    it('should assess path with mostly efficient transformations as efficient', () => {
      const assessPathPerformanceMethod = (mapper as any).assessPathPerformance.bind(mapper);
      
      const transformations = [
        { efficiency: 'efficient' },
        { efficiency: 'efficient' },
        { efficiency: 'efficient' }
      ];
      
      const result = assessPathPerformanceMethod(transformations);
      expect(result).toBe('efficient');
    });
  });
});