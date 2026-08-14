import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from '@the-new-fuse/database';
import { DatabaseService } from '@the-new-fuse/database/drizzle';
import { spaceAssets, spaceRoutes, spaces } from '@the-new-fuse/database/drizzle/schema';
import {
  CreateSpaceDto,
  RegisterSpaceAssetDto,
  UpdateSpaceDto,
  UpsertSpaceRouteDto,
} from './dto/spaces.dto';

const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;

@Injectable()
export class SpacesService {
  constructor(private readonly db: DatabaseService) {}

  private assertValidSubdomain(subdomain: string): void {
    if (!SUBDOMAIN_PATTERN.test(subdomain)) {
      throw new BadRequestException(
        'Subdomain must be 3-63 lowercase alphanumeric characters or hyphens, no leading/trailing hyphen'
      );
    }
  }

  async createSpace(userId: string, dto: CreateSpaceDto) {
    const subdomain = dto.subdomain.trim().toLowerCase();
    this.assertValidSubdomain(subdomain);

    const existing = await this.db.client
      .select({ id: spaces.id })
      .from(spaces)
      .where(eq(spaces.subdomain, subdomain))
      .limit(1);
    if (existing.length > 0) {
      throw new ConflictException(`Subdomain "${subdomain}" is already taken`);
    }

    const [created] = await this.db.client
      .insert(spaces)
      .values({
        userId,
        name: dto.name.trim(),
        subdomain,
        plan: dto.plan ?? 'free',
      })
      .returning();
    return created;
  }

  async listSpacesForUser(userId: string) {
    return this.db.client.select().from(spaces).where(eq(spaces.userId, userId));
  }

  /** Fetches a space and verifies ownership; throws NotFoundException otherwise. */
  private async getOwnedSpace(userId: string, spaceId: string) {
    const [space] = await this.db.client
      .select()
      .from(spaces)
      .where(and(eq(spaces.id, spaceId), eq(spaces.userId, userId)))
      .limit(1);
    if (!space) {
      throw new NotFoundException(`Space "${spaceId}" not found`);
    }
    return space;
  }

  async getSpace(userId: string, spaceId: string) {
    return this.getOwnedSpace(userId, spaceId);
  }

  async updateSpace(userId: string, spaceId: string, dto: UpdateSpaceDto) {
    await this.getOwnedSpace(userId, spaceId);
    const [updated] = await this.db.client
      .update(spaces)
      .set({
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.plan !== undefined ? { plan: dto.plan } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.customDomains !== undefined ? { customDomains: dto.customDomains } : {}),
        updatedAt: new Date(),
      })
      .where(eq(spaces.id, spaceId))
      .returning();
    return updated;
  }

  async deleteSpace(userId: string, spaceId: string) {
    await this.getOwnedSpace(userId, spaceId);
    await this.db.client.delete(spaces).where(eq(spaces.id, spaceId));
    return { deleted: true };
  }

  // ---------------------------------------------------------------------
  // Routes — mirrors Zo's write_space_route / edit_space_route semantics:
  // creating at an existing path overwrites it (full replace, not merge).
  // ---------------------------------------------------------------------

  async upsertRoute(userId: string, spaceId: string, dto: UpsertSpaceRouteDto) {
    await this.getOwnedSpace(userId, spaceId);
    const path = dto.path.startsWith('/') ? dto.path : `/${dto.path}`;

    const [existing] = await this.db.client
      .select({ id: spaceRoutes.id })
      .from(spaceRoutes)
      .where(and(eq(spaceRoutes.spaceId, spaceId), eq(spaceRoutes.path, path)))
      .limit(1);

    // API routes are always publicly reachable at the network level, same as Zo.
    const isPublic = dto.routeType === 'api' ? true : dto.public ?? false;

    if (existing) {
      const [updated] = await this.db.client
        .update(spaceRoutes)
        .set({
          routeType: dto.routeType,
          code: dto.code,
          isPublic,
          updatedAt: new Date(),
        })
        .where(eq(spaceRoutes.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db.client
      .insert(spaceRoutes)
      .values({
        spaceId,
        path,
        routeType: dto.routeType,
        code: dto.code,
        isPublic,
      })
      .returning();
    return created;
  }

  async listRoutes(userId: string, spaceId: string) {
    await this.getOwnedSpace(userId, spaceId);
    return this.db.client.select().from(spaceRoutes).where(eq(spaceRoutes.spaceId, spaceId));
  }

  async getRoute(userId: string, spaceId: string, routeId: string) {
    await this.getOwnedSpace(userId, spaceId);
    const [route] = await this.db.client
      .select()
      .from(spaceRoutes)
      .where(and(eq(spaceRoutes.id, routeId), eq(spaceRoutes.spaceId, spaceId)))
      .limit(1);
    if (!route) {
      throw new NotFoundException(`Route "${routeId}" not found in space "${spaceId}"`);
    }
    return route;
  }

  async deleteRoute(userId: string, spaceId: string, routeId: string) {
    await this.getRoute(userId, spaceId, routeId);
    await this.db.client.delete(spaceRoutes).where(eq(spaceRoutes.id, routeId));
    return { deleted: true };
  }

  // ---------------------------------------------------------------------
  // Assets — this service tracks metadata only. Binary storage (local FS
  // today, S3/R2 per the architecture doc) is handled by the caller, which
  // passes back the storageKey to register here.
  // ---------------------------------------------------------------------

  async registerAsset(userId: string, spaceId: string, dto: RegisterSpaceAssetDto) {
    await this.getOwnedSpace(userId, spaceId);
    const assetPath = dto.assetPath.startsWith('/') ? dto.assetPath : `/${dto.assetPath}`;

    const [existing] = await this.db.client
      .select({ id: spaceAssets.id })
      .from(spaceAssets)
      .where(and(eq(spaceAssets.spaceId, spaceId), eq(spaceAssets.assetPath, assetPath)))
      .limit(1);

    if (existing) {
      const [updated] = await this.db.client
        .update(spaceAssets)
        .set({
          fileSize: dto.fileSize,
          mimeType: dto.mimeType,
          storageKey: dto.storageKey,
          uploadedAt: new Date(),
        })
        .where(eq(spaceAssets.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db.client
      .insert(spaceAssets)
      .values({
        spaceId,
        assetPath,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        storageKey: dto.storageKey,
      })
      .returning();
    return created;
  }

  async listAssets(userId: string, spaceId: string) {
    await this.getOwnedSpace(userId, spaceId);
    return this.db.client.select().from(spaceAssets).where(eq(spaceAssets.spaceId, spaceId));
  }

  async deleteAsset(userId: string, spaceId: string, assetId: string) {
    await this.getOwnedSpace(userId, spaceId);
    const [asset] = await this.db.client
      .select({ id: spaceAssets.id })
      .from(spaceAssets)
      .where(and(eq(spaceAssets.id, assetId), eq(spaceAssets.spaceId, spaceId)))
      .limit(1);
    if (!asset) {
      throw new NotFoundException(`Asset "${assetId}" not found in space "${spaceId}"`);
    }
    await this.db.client.delete(spaceAssets).where(eq(spaceAssets.id, assetId));
    return { deleted: true };
  }
}
