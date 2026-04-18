import { ResourceAccessControlService } from '../../src/services/resource-access-control.service.js';
import { Resource, ResourceVisibility, ResourceCategory, ResourceType, ResourceStatus } from '../../src/types/index.js';

describe('ResourceAccessControlService', () => {
  let service: ResourceAccessControlService;

  beforeEach(() => {
    service = new ResourceAccessControlService();
  });

  const createMockResource = (visibility: ResourceVisibility, authorId?: string): Resource => ({
    id: 'test-id',
    name: 'Test Resource',
    category: ResourceCategory.CODE_SNIPPET,
    type: ResourceType.TYPESCRIPT,
    content: {},
    tags: [],
    version: '1.0.0',
    source: 'test',
    visibility,
    authorId,
    keywords: [],
    usageCount: 0,
    downloadCount: 0,
    favoriteCount: 0,
    status: ResourceStatus.ACTIVE,
    isVerified: false,
    isFeatured: false,
    dependencies: [],
    relatedResources: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('canView', () => {
    it('should allow everyone to view public resources', () => {
      const resource = createMockResource(ResourceVisibility.PUBLIC);
      const context = { isAgent: false, isAdmin: false };

      expect(service.canView(resource, context)).toBe(true);
    });

    it('should only allow agents to view AGENTS_ONLY resources', () => {
      const resource = createMockResource(ResourceVisibility.AGENTS_ONLY);

      const agentContext = { isAgent: true, isAdmin: false };
      expect(service.canView(resource, agentContext)).toBe(true);

      const userContext = { isAgent: false, isAdmin: false };
      expect(service.canView(resource, userContext)).toBe(false);
    });

    it('should only allow owner and admin to view private resources', () => {
      const resource = createMockResource(ResourceVisibility.PRIVATE, 'user-123');

      const ownerContext = { userId: 'user-123', isAgent: false, isAdmin: false };
      expect(service.canView(resource, ownerContext)).toBe(true);

      const adminContext = { isAgent: false, isAdmin: true };
      expect(service.canView(resource, adminContext)).toBe(true);

      const otherContext = { userId: 'user-456', isAgent: false, isAdmin: false };
      expect(service.canView(resource, otherContext)).toBe(false);
    });
  });

  describe('canModify', () => {
    it('should only allow owner and admin to modify resources', () => {
      const resource = createMockResource(ResourceVisibility.PUBLIC, 'user-123');

      const ownerContext = { userId: 'user-123', isAgent: false, isAdmin: false };
      expect(service.canModify(resource, ownerContext)).toBe(true);

      const adminContext = { isAgent: false, isAdmin: true };
      expect(service.canModify(resource, adminContext)).toBe(true);

      const otherContext = { userId: 'user-456', isAgent: false, isAdmin: false };
      expect(service.canModify(resource, otherContext)).toBe(false);
    });
  });

  describe('filterByAccess', () => {
    it('should filter resources based on access permissions', () => {
      const resources = [
        createMockResource(ResourceVisibility.PUBLIC),
        createMockResource(ResourceVisibility.PRIVATE, 'user-123'),
        createMockResource(ResourceVisibility.AGENTS_ONLY),
      ];

      const userContext = { userId: 'user-456', isAgent: false, isAdmin: false };
      const filtered = service.filterByAccess(resources, userContext);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].visibility).toBe(ResourceVisibility.PUBLIC);
    });
  });

  describe('assertCanView', () => {
    it('should throw ForbiddenException if access is denied', () => {
      const resource = createMockResource(ResourceVisibility.PRIVATE, 'user-123');
      const context = { userId: 'user-456', isAgent: false, isAdmin: false };

      expect(() => service.assertCanView(resource, context)).toThrow();
    });

    it('should not throw if access is allowed', () => {
      const resource = createMockResource(ResourceVisibility.PUBLIC);
      const context = { isAgent: false, isAdmin: false };

      expect(() => service.assertCanView(resource, context)).not.toThrow();
    });
  });
});
