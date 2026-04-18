import { randomUUID } from 'crypto';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../client';
import { workspaceBookmarks } from '../schema';
import type { NewWorkspaceBookmark, WorkspaceBookmark } from '../types';

export class DrizzleWorkspaceBookmarkRepository {
  async listByWorkspace(workspaceId: string): Promise<WorkspaceBookmark[]> {
    return db
      .select()
      .from(workspaceBookmarks)
      .where(eq(workspaceBookmarks.workspaceId, workspaceId))
      .orderBy(asc(workspaceBookmarks.createdAt));
  }

  async listByWorkspaceForUser(workspaceId: string, userId: string): Promise<WorkspaceBookmark[]> {
    return db
      .select()
      .from(workspaceBookmarks)
      .where(
        and(
          eq(workspaceBookmarks.workspaceId, workspaceId),
          eq(workspaceBookmarks.createdByUserId, userId)
        )
      )
      .orderBy(asc(workspaceBookmarks.createdAt));
  }

  async findById(workspaceId: string, id: string): Promise<WorkspaceBookmark | null> {
    const [bookmark] = await db
      .select()
      .from(workspaceBookmarks)
      .where(and(eq(workspaceBookmarks.workspaceId, workspaceId), eq(workspaceBookmarks.id, id)));
    return bookmark ?? null;
  }

  async findByIdForUser(
    workspaceId: string,
    id: string,
    userId: string
  ): Promise<WorkspaceBookmark | null> {
    const [bookmark] = await db
      .select()
      .from(workspaceBookmarks)
      .where(
        and(
          eq(workspaceBookmarks.workspaceId, workspaceId),
          eq(workspaceBookmarks.id, id),
          eq(workspaceBookmarks.createdByUserId, userId)
        )
      );
    return bookmark ?? null;
  }

  async findByUrl(workspaceId: string, url: string): Promise<WorkspaceBookmark | null> {
    const [bookmark] = await db
      .select()
      .from(workspaceBookmarks)
      .where(and(eq(workspaceBookmarks.workspaceId, workspaceId), eq(workspaceBookmarks.url, url)));
    return bookmark ?? null;
  }

  async findByUrlForUser(
    workspaceId: string,
    url: string,
    userId: string
  ): Promise<WorkspaceBookmark | null> {
    const [bookmark] = await db
      .select()
      .from(workspaceBookmarks)
      .where(
        and(
          eq(workspaceBookmarks.workspaceId, workspaceId),
          eq(workspaceBookmarks.url, url),
          eq(workspaceBookmarks.createdByUserId, userId)
        )
      );
    return bookmark ?? null;
  }

  async addBookmark(
    data: Omit<NewWorkspaceBookmark, 'id'> & { id?: string }
  ): Promise<WorkspaceBookmark> {
    const id = data.id || `wb_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const [bookmark] = await db
      .insert(workspaceBookmarks)
      .values({ ...data, id } as NewWorkspaceBookmark)
      .returning();
    return bookmark;
  }

  async updateBookmark(
    workspaceId: string,
    id: string,
    data: Partial<Omit<NewWorkspaceBookmark, 'id' | 'workspaceId' | 'createdAt' | 'createdByUserId'>>
  ): Promise<WorkspaceBookmark | null> {
    const [bookmark] = await db
      .update(workspaceBookmarks)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(workspaceBookmarks.workspaceId, workspaceId), eq(workspaceBookmarks.id, id)))
      .returning();
    return bookmark ?? null;
  }

  async updateBookmarkForUser(
    workspaceId: string,
    id: string,
    userId: string,
    data: Partial<Omit<NewWorkspaceBookmark, 'id' | 'workspaceId' | 'createdAt' | 'createdByUserId'>>
  ): Promise<WorkspaceBookmark | null> {
    const [bookmark] = await db
      .update(workspaceBookmarks)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(workspaceBookmarks.workspaceId, workspaceId),
          eq(workspaceBookmarks.id, id),
          eq(workspaceBookmarks.createdByUserId, userId)
        )
      )
      .returning();
    return bookmark ?? null;
  }

  async removeBookmark(workspaceId: string, id: string): Promise<boolean> {
    const rows = await db
      .delete(workspaceBookmarks)
      .where(and(eq(workspaceBookmarks.workspaceId, workspaceId), eq(workspaceBookmarks.id, id)))
      .returning();
    return rows.length > 0;
  }

  async removeBookmarkForUser(workspaceId: string, id: string, userId: string): Promise<boolean> {
    const rows = await db
      .delete(workspaceBookmarks)
      .where(
        and(
          eq(workspaceBookmarks.workspaceId, workspaceId),
          eq(workspaceBookmarks.id, id),
          eq(workspaceBookmarks.createdByUserId, userId)
        )
      )
      .returning();
    return rows.length > 0;
  }
}

export const drizzleWorkspaceBookmarkRepository = new DrizzleWorkspaceBookmarkRepository();
