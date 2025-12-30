import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import * as semver from 'semver';
import { CreateResourceDto, SearchResourceDto, UpdateResourceDto } from '../dto';
import { Resource, ResourceAction, SearchResult } from '../types';

@Injectable()
export class ResourceRegistryService {
  private readonly logger = new Logger(ResourceRegistryService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  /**
   * Create a new resource
   */
  async create(dto: CreateResourceDto): Promise<Resource> {
    this.logger.log(`Creating resource: ${dto.name}`);

    // Validate semantic version
    if (!semver.valid(dto.version)) {
      throw new BadRequestException(`Invalid semantic version: ${dto.version}`);
    }

    // Build searchable text from name, description, tags, and keywords
    const searchableText = this.buildSearchableText(dto);

    const data: any = {
      name: dto.name,
      description: dto.description,
      category: dto.category,
      type: dto.type,
      content: dto.content,
      tags: dto.tags || [],
      version: dto.version,
      source: dto.source,
      visibility: dto.visibility || 'PUBLIC',
      author: dto.author,
      authorId: dto.authorId,
      license: dto.license,
      homepage: dto.homepage,
      repository: dto.repository,
      searchableText,
      keywords: dto.keywords || [],
      status: dto.status || 'ACTIVE',
      isVerified: dto.isVerified || false,
      isFeatured: dto.isFeatured || false,
      dependencies: dto.dependencies || [],
      relatedResources: dto.relatedResources || [],
    };

    const resource = await (this.prisma as any).resource.create({
      data,
      include: {
        metadata: true,
        versions: true,
      },
    });

    // Create initial version
    await (this.prisma as any).resourceVersion.create({
      data: {
        resourceId: resource.id,
        version: dto.version,
        content: dto.content,
        isLatest: true,
        isDraft: dto.status === 'DRAFT',
        createdBy: dto.authorId,
      },
    });

    // Create metadata if provided
    if (dto.metadata) {
      await (this.prisma as any).resourceMetadata.create({
        data: {
          resourceId: resource.id,
          metadata: dto.metadata,
          performanceMetrics: dto.metadata.performanceMetrics,
          qualityScore: dto.metadata.qualityScore,
          complexityScore: dto.metadata.complexityScore,
          estimatedExecutionTime: dto.metadata.estimatedExecutionTime,
          requiredDependencies: dto.metadata.requiredDependencies || [],
          optionalDependencies: dto.metadata.optionalDependencies || [],
          minimumNodeVersion: dto.metadata.minimumNodeVersion,
          platforms: dto.metadata.platforms || [],
          configSchema: dto.metadata.configSchema,
        },
      });
    }

    this.logger.log(`Resource created: ${resource.id}`);
    return resource as Resource;
  }

  /**
   * Find resource by ID
   */
  async findById(id: string): Promise<Resource> {
    const resource = await (this.prisma as any).resource.findUnique({
      where: { id },
      include: {
        metadata: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!resource) {
      throw new NotFoundException(`Resource not found: ${id}`);
    }

    return resource as Resource;
  }

  /**
   * Search resources with filters, sorting, and pagination
   */
  async search(dto: SearchResourceDto): Promise<SearchResult<Resource>> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = this.buildSearchFilters(dto);
    const orderBy: any = this.buildSortOptions(dto);

    const [resources, total] = await Promise.all([
      (this.prisma as any).resource.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          metadata: true,
        },
      }),
      (this.prisma as any).resource.count({ where }),
    ]);

    return {
      data: resources as Resource[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update a resource
   */
  async update(id: string, dto: UpdateResourceDto): Promise<Resource> {
    this.logger.log(`Updating resource: ${id}`);

    const existing = await this.findById(id);

    // If version is being updated, validate it
    if (dto.version && dto.version !== existing.version) {
      if (!semver.valid(dto.version)) {
        throw new BadRequestException(`Invalid semantic version: ${dto.version}`);
      }

      // Create new version
      await (this.prisma as any).resourceVersion.updateMany({
        where: { resourceId: id, isLatest: true },
        data: { isLatest: false },
      });

      await (this.prisma as any).resourceVersion.create({
        data: {
          resourceId: id,
          version: dto.version,
          content: dto.content || existing.content,
          isLatest: true,
          isDraft: dto.status === 'DRAFT',
          createdBy: dto.authorId,
        },
      });
    }

    // Build updated searchable text
    const searchableText =
      dto.name || dto.description || dto.tags || dto.keywords
        ? this.buildSearchableText({ ...existing, ...dto } as CreateResourceDto)
        : undefined;

    const data: any = {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.category && { category: dto.category }),
      ...(dto.type && { type: dto.type }),
      ...(dto.content && { content: dto.content }),
      ...(dto.tags && { tags: dto.tags }),
      ...(dto.version && { version: dto.version }),
      ...(dto.source && { source: dto.source }),
      ...(dto.visibility && { visibility: dto.visibility }),
      ...(dto.author !== undefined && { author: dto.author }),
      ...(dto.authorId !== undefined && { authorId: dto.authorId }),
      ...(dto.license !== undefined && { license: dto.license }),
      ...(dto.homepage !== undefined && { homepage: dto.homepage }),
      ...(dto.repository !== undefined && { repository: dto.repository }),
      ...(searchableText && { searchableText }),
      ...(dto.keywords && { keywords: dto.keywords }),
      ...(dto.status && { status: dto.status }),
      ...(dto.isVerified !== undefined && { isVerified: dto.isVerified }),
      ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
      ...(dto.dependencies && { dependencies: dto.dependencies }),
      ...(dto.relatedResources && { relatedResources: dto.relatedResources }),
    };

    const resource = await (this.prisma as any).resource.update({
      where: { id },
      data,
      include: {
        metadata: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // Update metadata if provided
    if (dto.metadata) {
      await (this.prisma as any).resourceMetadata.upsert({
        where: { resourceId: id },
        create: {
          resourceId: id,
          metadata: dto.metadata,
          performanceMetrics: dto.metadata.performanceMetrics,
          qualityScore: dto.metadata.qualityScore,
          complexityScore: dto.metadata.complexityScore,
          estimatedExecutionTime: dto.metadata.estimatedExecutionTime,
          requiredDependencies: dto.metadata.requiredDependencies || [],
          optionalDependencies: dto.metadata.optionalDependencies || [],
          minimumNodeVersion: dto.metadata.minimumNodeVersion,
          platforms: dto.metadata.platforms || [],
          configSchema: dto.metadata.configSchema,
        },
        update: {
          metadata: dto.metadata,
          performanceMetrics: dto.metadata.performanceMetrics,
          qualityScore: dto.metadata.qualityScore,
          complexityScore: dto.metadata.complexityScore,
          estimatedExecutionTime: dto.metadata.estimatedExecutionTime,
          requiredDependencies: dto.metadata.requiredDependencies || [],
          optionalDependencies: dto.metadata.optionalDependencies || [],
          minimumNodeVersion: dto.metadata.minimumNodeVersion,
          platforms: dto.metadata.platforms || [],
          configSchema: dto.metadata.configSchema,
        },
      });
    }

    this.logger.log(`Resource updated: ${id}`);
    return resource as Resource;
  }

  /**
   * Delete a resource (soft delete)
   */
  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting resource: ${id}`);

    await (this.prisma as any).resource.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Resource deleted: ${id}`);
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    const result = await (this.prisma as any).resource.findMany({
      distinct: ['category'],
      select: { category: true },
    });

    return result.map((r) => r.category);
  }

  /**
   * Log resource access
   */
  async logAccess(
    resourceId: string,
    action: ResourceAction,
    accessorId?: string,
    accessorType: string = 'system',
    metadata?: any
  ): Promise<void> {
    await (this.prisma as any).resourceAccessLog.create({
      data: {
        resourceId,
        action,
        accessorId,
        accessorType,
        metadata,
      },
    });

    // Update usage counts
    if (action === 'VIEW') {
      await (this.prisma as any).resource.update({
        where: { id: resourceId },
        data: { usageCount: { increment: 1 } },
      });
    } else if (action === 'DOWNLOAD') {
      await (this.prisma as any).resource.update({
        where: { id: resourceId },
        data: { downloadCount: { increment: 1 } },
      });
    } else if (action === 'FAVORITE') {
      await (this.prisma as any).resource.update({
        where: { id: resourceId },
        data: { favoriteCount: { increment: 1 } },
      });
    }
  }

  /**
   * Get resource versions
   */
  async getVersions(resourceId: string): Promise<any[]> {
    return (this.prisma as any).resourceVersion.findMany({
      where: { resourceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get specific version
   */
  async getVersion(resourceId: string, version: string): Promise<any> {
    const resourceVersion = await (this.prisma as any).resourceVersion.findUnique({
      where: {
        resourceId_version: {
          resourceId,
          version,
        },
      },
    });

    if (!resourceVersion) {
      throw new NotFoundException(`Version ${version} not found for resource ${resourceId}`);
    }

    return resourceVersion;
  }

  // Private helper methods

  private buildSearchableText(dto: Partial<CreateResourceDto>): string {
    const parts = [dto.name, dto.description, ...(dto.tags || []), ...(dto.keywords || [])].filter(
      Boolean
    );

    return parts.join(' ').toLowerCase();
  }

  private buildSearchFilters(dto: SearchResourceDto): any {
    const where: any = {};

    // Text search
    if (dto.query) {
      where.OR = [
        { name: { contains: dto.query, mode: 'insensitive' } },
        { description: { contains: dto.query, mode: 'insensitive' } },
        { searchableText: { contains: dto.query, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (dto.category && dto.category.length > 0) {
      where.category = { in: dto.category };
    }

    // Type filter
    if (dto.type && dto.type.length > 0) {
      where.type = { in: dto.type };
    }

    // Visibility filter
    if (dto.visibility && dto.visibility.length > 0) {
      where.visibility = { in: dto.visibility };
    }

    // Status filter
    if (dto.status && dto.status.length > 0) {
      where.status = { in: dto.status };
    }

    // Tags filter
    if (dto.tags && dto.tags.length > 0) {
      where.tags = { hasSome: dto.tags };
    }

    // Keywords filter
    if (dto.keywords && dto.keywords.length > 0) {
      where.keywords = { hasSome: dto.keywords };
    }

    // Author filters
    if (dto.author) {
      where.author = { contains: dto.author, mode: 'insensitive' };
    }

    if (dto.authorId) {
      where.authorId = dto.authorId;
    }

    // Boolean filters
    if (dto.isVerified !== undefined) {
      where.isVerified = dto.isVerified;
    }

    if (dto.isFeatured !== undefined) {
      where.isFeatured = dto.isFeatured;
    }

    // Date range filters
    if (dto.createdAfter || dto.createdBefore) {
      where.createdAt = {};
      if (dto.createdAfter) {
        where.createdAt.gte = new Date(dto.createdAfter);
      }
      if (dto.createdBefore) {
        where.createdAt.lte = new Date(dto.createdBefore);
      }
    }

    // Exclude deleted resources by default
    where.status = { not: 'DELETED' };

    return where;
  }

  private buildSortOptions(dto: SearchResourceDto): any {
    const sortBy = dto.sortBy || 'createdAt';
    const sortOrder = dto.sortOrder || 'desc';

    return { [sortBy]: sortOrder };
  }
}
