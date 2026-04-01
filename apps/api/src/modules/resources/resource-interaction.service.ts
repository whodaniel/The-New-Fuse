import { Injectable } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
import { and, eq } from '@the-new-fuse/database';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database/drizzle';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { resourceFavorites, resourceShares } from '@the-new-fuse/database/drizzle/schema';

export type ResourceShareRecord = {
  id: string | null;
  resourceId: string;
  fromUserId: string;
  toAgentId: string;
  notes: string | null;
  sharedAt: string;
};

@Injectable()
export class ResourceInteractionService {
  constructor(private readonly db: DatabaseService) {}

  async toggleFavorite(resourceId: string, userId: string): Promise<{ favorite: boolean }> {
    const existing = await this.db.client
      .select({ id: resourceFavorites.id })
      .from(resourceFavorites)
      .where(
        and(eq(resourceFavorites.resourceId, resourceId), eq(resourceFavorites.userId, userId))
      )
      .limit(1);

    if (existing.length > 0) {
      await this.db.client
        .delete(resourceFavorites)
        .where(
          and(eq(resourceFavorites.resourceId, resourceId), eq(resourceFavorites.userId, userId))
        );
      return { favorite: false };
    }

    await this.db.client.insert(resourceFavorites).values({
      resourceId,
      userId,
    });
    return { favorite: true };
  }

  async shareResource(input: {
    resourceId: string;
    fromUserId: string;
    toAgentId: string;
    notes?: string | null;
  }): Promise<ResourceShareRecord> {
    const notes = input.notes?.trim() || null;
    const [saved] = await this.db.client
      .insert(resourceShares)
      .values({
        resourceId: input.resourceId,
        fromUserId: input.fromUserId,
        toAgentId: input.toAgentId,
        notes,
      })
      .returning({
        id: resourceShares.id,
        resourceId: resourceShares.resourceId,
        fromUserId: resourceShares.fromUserId,
        toAgentId: resourceShares.toAgentId,
        notes: resourceShares.notes,
        sharedAt: resourceShares.sharedAt,
      });

    return {
      id: saved?.id || null,
      resourceId: saved?.resourceId || input.resourceId,
      fromUserId: saved?.fromUserId || input.fromUserId,
      toAgentId: saved?.toAgentId || input.toAgentId,
      notes: saved?.notes ?? notes,
      sharedAt:
        (saved?.sharedAt instanceof Date ? saved.sharedAt.toISOString() : saved?.sharedAt) ||
        new Date().toISOString(),
    };
  }
}
