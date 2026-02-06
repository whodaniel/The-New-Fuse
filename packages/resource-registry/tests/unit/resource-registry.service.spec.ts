import { ResourceRegistryService } from '../../src/services/resource-registry.service';
import { ResourceCategory, ResourceType } from '../../src/types';

describe('ResourceRegistryService', () => {
  let service: ResourceRegistryService;

  beforeEach(() => {
    service = new ResourceRegistryService();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('create', () => {
    it('should create a resource with valid data', async () => {
      const createDto = {
        name: 'Test Resource',
        description: 'A test resource',
        category: ResourceCategory.CODE_SNIPPET,
        type: ResourceType.TYPESCRIPT,
        content: { code: 'console.log("test");' },
        tags: ['test', 'example'],
        version: '1.0.0',
        source: 'test-source',
        keywords: ['test'],
      };

      const resource = await service.create(createDto);

      expect(resource).toBeDefined();
      expect(resource.id).toBeDefined();
      expect(resource.name).toBe(createDto.name);
      expect(resource.category).toBe(createDto.category);
      expect(resource.version).toBe(createDto.version);

      // Cleanup
      await service.delete(resource.id);
    });

    it('should throw error for invalid version', async () => {
      const createDto = {
        name: 'Test Resource',
        category: ResourceCategory.CODE_SNIPPET,
        type: ResourceType.TYPESCRIPT,
        content: { code: 'test' },
        version: 'invalid',
        source: 'test',
      };

      await expect(service.create(createDto)).rejects.toThrow();
    });
  });

  describe('search', () => {
    it('should search resources with filters', async () => {
      const searchDto = {
        category: [ResourceCategory.CODE_SNIPPET],
        page: 1,
        limit: 10,
      };

      const result = await service.search(searchDto);

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by tags', async () => {
      const searchDto = {
        tags: ['test'],
        page: 1,
        limit: 10,
      };

      const result = await service.search(searchDto);

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException for non-existent resource', async () => {
      await expect(service.findById('non-existent-id')).rejects.toThrow();
    });
  });

  describe('getCategories', () => {
    it('should return array of categories', async () => {
      const categories = await service.getCategories();

      expect(categories).toBeInstanceOf(Array);
    });
  });
});
