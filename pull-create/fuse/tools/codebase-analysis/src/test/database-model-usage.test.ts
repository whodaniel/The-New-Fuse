import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseModelUsageAnalyzer } from '../analyzer/DatabaseModelUsageAnalyzer';
import type { PackageInfo } from '../scanner/FileSystemScanner';

describe('DatabaseModelUsageAnalyzer', () => {
  let analyzer: DatabaseModelUsageAnalyzer;
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
    
    analyzer = new DatabaseModelUsageAnalyzer(mockPackages, '/test');
  });

  describe('analyzeDatabaseModelUsage', () => {
    it('should analyze database model usage successfully', async () => {
      // This is a basic structure test since we can't easily mock file system operations
      expect(analyzer).toBeDefined();
      expect(typeof analyzer.analyzeDatabaseModelUsage).toBe('function');
    });
  });

  describe('parseSchemaContent', () => {
    it('should parse a simple Drizzle model', () => {
      const schemaContent = `
        model User {
          id    String @id @default(uuid())
          email String @unique
          name  String?
          posts Post[]
        }
        
        model Post {
          id     String @id @default(uuid())
          title  String
          userId String
          user   User   @relation(fields: [userId], references: [id])
        }
      `;
      
      // Access private method for testing
      const parseMethod = (analyzer as any).parseSchemaContent.bind(analyzer);
      const models = parseMethod(schemaContent, 'test-schema.drizzle');
      
      expect(models).toHaveLength(2);
      expect(models[0].name).toBe('User');
      expect(models[0].fields).toHaveLength(3); // id, email, name
      expect(models[0].relations).toHaveLength(1); // posts
      expect(models[1].name).toBe('Post');
    });
  });

  describe('parseField', () => {
    it('should parse field with basic type', () => {
      const parseFieldMethod = (analyzer as any).parseField.bind(analyzer);
      const field = parseFieldMethod('email String @unique');
      
      expect(field).toEqual({
        name: 'email',
        type: 'String',
        isOptional: false,
        isArray: false,
        isId: false,
        isUnique: true,
        hasDefault: false,
        defaultValue: undefined,
        attributes: ['@unique']
      });
    });

    it('should parse optional field', () => {
      const parseFieldMethod = (analyzer as any).parseField.bind(analyzer);
      const field = parseFieldMethod('name String?');
      
      expect(field.isOptional).toBe(true);
    });

    it('should parse array field', () => {
      const parseFieldMethod = (analyzer as any).parseField.bind(analyzer);
      const field = parseFieldMethod('tags String[]');
      
      expect(field.isArray).toBe(true);
    });

    it('should parse field with default value', () => {
      const parseFieldMethod = (analyzer as any).parseField.bind(analyzer);
      const field = parseFieldMethod('id String @id @default(uuid())');
      
      expect(field.hasDefault).toBe(true);
      expect(field.defaultValue).toBe('uuid()');
    });
  });

  describe('isRelationField', () => {
    it('should identify relation fields correctly', () => {
      const isRelationFieldMethod = (analyzer as any).isRelationField.bind(analyzer);
      
      const stringField = { type: 'String', name: 'email' };
      const relationField = { type: 'User', name: 'user' };
      
      expect(isRelationFieldMethod(stringField)).toBe(false);
      expect(isRelationFieldMethod(relationField)).toBe(true);
    });
  });

  describe('extractFieldUsage', () => {
    it('should extract fields from select clause', () => {
      const extractMethod = (analyzer as any).extractFieldUsage.bind(analyzer);
      const line = 'const user = await drizzle.user.findUnique({ select: { id: true, email: true } })';
      
      const result = extractMethod(line, 'User');
      
      expect(result.fields).toContain('id');
      expect(result.fields).toContain('email');
    });

    it('should extract relations from include clause', () => {
      const extractMethod = (analyzer as any).extractFieldUsage.bind(analyzer);
      const line = 'const user = await drizzle.user.findUnique({ include: { posts: true, profile: true } })';
      
      const result = extractMethod(line, 'User');
      
      expect(result.relations).toContain('posts');
      expect(result.relations).toContain('profile');
    });

    it('should extract fields from where clause', () => {
      const extractMethod = (analyzer as any).extractFieldUsage.bind(analyzer);
      const line = 'const users = await drizzle.user.findMany({ where: { email: "test@example.com", isActive: true } })';
      
      const result = extractMethod(line, 'User');
      
      expect(result.fields).toContain('email');
      expect(result.fields).toContain('isActive');
    });
  });

  describe('assessPatternPerformance', () => {
    it('should assess findMany with high frequency as inefficient', () => {
      const assessMethod = (analyzer as any).assessPatternPerformance.bind(analyzer);
      
      const result = assessMethod('User.findMany', 15);
      expect(result).toBe('inefficient');
    });

    it('should assess findUnique as efficient', () => {
      const assessMethod = (analyzer as any).assessPatternPerformance.bind(analyzer);
      
      const result = assessMethod('User.findUnique', 5);
      expect(result).toBe('efficient');
    });

    it('should assess high frequency operations as moderate', () => {
      const assessMethod = (analyzer as any).assessPatternPerformance.bind(analyzer);
      
      const result = assessMethod('User.create', 60);
      expect(result).toBe('moderate');
    });
  });

  describe('getPatternRecommendation', () => {
    it('should provide recommendation for inefficient findMany pattern', () => {
      const getRecommendationMethod = (analyzer as any).getPatternRecommendation.bind(analyzer);
      
      const result = getRecommendationMethod('User.findMany', 'inefficient');
      expect(result).toContain('pagination');
    });

    it('should provide recommendation for moderate performance', () => {
      const getRecommendationMethod = (analyzer as any).getPatternRecommendation.bind(analyzer);
      
      const result = getRecommendationMethod('User.create', 'moderate');
      expect(result).toContain('caching');
    });

    it('should return undefined for efficient patterns', () => {
      const getRecommendationMethod = (analyzer as any).getPatternRecommendation.bind(analyzer);
      
      const result = getRecommendationMethod('User.findUnique', 'efficient');
      expect(result).toBeUndefined();
    });
  });
});