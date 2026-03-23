import { randomUUID } from 'crypto';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../client';
import { users, workspaceInvites } from '../schema';
import type { NewWorkspaceInvite, WorkspaceInvite } from '../types';

type WorkspaceInviteStatus = WorkspaceInvite['status'];

export class DrizzleWorkspaceInviteRepository {
  async createInvite(
    data: Omit<NewWorkspaceInvite, 'id' | 'inviteToken'> & {
      id?: string;
      inviteToken?: string;
    }
  ): Promise<WorkspaceInvite> {
    const id = data.id || `wsi_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const inviteToken = data.inviteToken || randomUUID();

    const [invite] = await db
      .insert(workspaceInvites)
      .values({
        ...(data as Omit<NewWorkspaceInvite, 'id' | 'inviteToken'>),
        id,
        inviteToken,
      } as NewWorkspaceInvite)
      .returning();

    return invite;
  }

  async upsertPendingInvite(
    data: Omit<NewWorkspaceInvite, 'id' | 'inviteToken' | 'status'> & {
      id?: string;
      inviteToken?: string;
      status?: WorkspaceInviteStatus;
    }
  ): Promise<WorkspaceInvite> {
    const id = data.id || `wsi_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const inviteToken = data.inviteToken || randomUUID();

    const [invite] = await db
      .insert(workspaceInvites)
      .values({
        ...(data as Omit<NewWorkspaceInvite, 'id' | 'inviteToken' | 'status'>),
        id,
        inviteToken,
        status: data.status || 'pending',
      } as NewWorkspaceInvite)
      .onConflictDoUpdate({
        target: [workspaceInvites.workspaceId, workspaceInvites.invitedEmail],
        set: {
          role: data.role,
          invitedByUserId: data.invitedByUserId ?? null,
          inviteToken,
          status: 'pending',
          expiresAt: data.expiresAt ?? null,
          acceptedByUserId: null,
          acceptedAt: null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return invite;
  }

  async findById(id: string): Promise<WorkspaceInvite | null> {
    const [invite] = await db.select().from(workspaceInvites).where(eq(workspaceInvites.id, id));
    return invite ?? null;
  }

  async findByToken(token: string): Promise<WorkspaceInvite | null> {
    const [invite] = await db
      .select()
      .from(workspaceInvites)
      .where(eq(workspaceInvites.inviteToken, token));
    return invite ?? null;
  }

  async findPendingByToken(token: string): Promise<WorkspaceInvite | null> {
    const [invite] = await db
      .select()
      .from(workspaceInvites)
      .where(
        and(eq(workspaceInvites.inviteToken, token), eq(workspaceInvites.status, 'pending'))
      );
    return invite ?? null;
  }

  async findByWorkspaceAndEmail(
    workspaceId: string,
    invitedEmail: string
  ): Promise<WorkspaceInvite | null> {
    const [invite] = await db
      .select()
      .from(workspaceInvites)
      .where(
        and(
          eq(workspaceInvites.workspaceId, workspaceId),
          eq(workspaceInvites.invitedEmail, invitedEmail.toLowerCase())
        )
      );
    return invite ?? null;
  }

  async listByWorkspace(
    workspaceId: string,
    statuses?: WorkspaceInviteStatus[]
  ): Promise<
    Array<
      WorkspaceInvite & {
        invitedByEmail: string | null;
        acceptedByEmail: string | null;
      }
    >
  > {
    const invites = await db
      .select()
      .from(workspaceInvites)
      .where(
        statuses && statuses.length > 0
          ? and(
              eq(workspaceInvites.workspaceId, workspaceId),
              inArray(workspaceInvites.status, statuses)
            )
          : eq(workspaceInvites.workspaceId, workspaceId)
      )
      .orderBy(desc(workspaceInvites.createdAt));

    if (invites.length === 0) {
      return [];
    }

    const userIds = [...new Set(invites.flatMap((invite) => [invite.invitedByUserId, invite.acceptedByUserId]))]
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    const userRows =
      userIds.length > 0
        ? await db
            .select({ id: users.id, email: users.email })
            .from(users)
            .where(inArray(users.id, userIds))
        : [];
    const emailByUserId = new Map(userRows.map((row) => [row.id, row.email]));

    return invites.map((invite) => ({
      ...invite,
      invitedByEmail: invite.invitedByUserId ? (emailByUserId.get(invite.invitedByUserId) ?? null) : null,
      acceptedByEmail: invite.acceptedByUserId
        ? (emailByUserId.get(invite.acceptedByUserId) ?? null)
        : null,
    }));
  }

  async listPendingByWorkspace(
    workspaceId: string
  ): Promise<
    Array<
      WorkspaceInvite & {
        invitedByEmail: string | null;
        acceptedByEmail: string | null;
      }
    >
  > {
    return this.listByWorkspace(workspaceId, ['pending']);
  }

  async markAccepted(inviteId: string, acceptedByUserId: string): Promise<WorkspaceInvite | null> {
    const [invite] = await db
      .update(workspaceInvites)
      .set({
        status: 'accepted',
        acceptedByUserId,
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workspaceInvites.id, inviteId))
      .returning();

    return invite ?? null;
  }

  async markExpired(inviteId: string): Promise<WorkspaceInvite | null> {
    const [invite] = await db
      .update(workspaceInvites)
      .set({
        status: 'expired',
        updatedAt: new Date(),
      })
      .where(eq(workspaceInvites.id, inviteId))
      .returning();

    return invite ?? null;
  }

  async revoke(inviteId: string): Promise<WorkspaceInvite | null> {
    const [invite] = await db
      .update(workspaceInvites)
      .set({
        status: 'revoked',
        updatedAt: new Date(),
      })
      .where(eq(workspaceInvites.id, inviteId))
      .returning();

    return invite ?? null;
  }
}

export const drizzleWorkspaceInviteRepository = new DrizzleWorkspaceInviteRepository();
