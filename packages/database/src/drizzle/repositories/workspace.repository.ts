import { desc, eq, InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import { db } from '../client';
import { projects, users, workspaces } from '../schema';

export type Workspace = InferSelectModel<typeof workspaces>;
export type NewWorkspace = InferInsertModel<typeof workspaces>;

/**
 * Workspace Repository - provides data access for Workspace entities
 */
export class DrizzleWorkspaceRepository {
  /**
   * Create a new workspace
   */
  async create(data: NewWorkspace): Promise<Workspace> {
    const [workspace] = await db.insert(workspaces).values(data).returning();
    return workspace;
  }

  /**
   * Find workspace by ID
   */
  async findById(id: string): Promise<Workspace | null> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace ?? null;
  }

  /**
   * Find workspace by name (slug)
   */
  async findByName(name: string): Promise<Workspace | null> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.name, name));
    return workspace ?? null;
  }

  /**
   * Find all workspaces for an owner
   */
  async findByOwner(ownerId: string): Promise<Workspace[]> {
    return db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, ownerId))
      .orderBy(desc(workspaces.createdAt));
  }

  /**
   * Update workspace
   */
  async update(id: string, data: Partial<NewWorkspace>): Promise<Workspace | null> {
    const [workspace] = await db
      .update(workspaces)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning();
    return workspace ?? null;
  }

  /**
   * Delete workspace
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(workspaces).where(eq(workspaces.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Find all workspaces
   */
  async findAll(): Promise<Workspace[]> {
    return db.select().from(workspaces).orderBy(desc(workspaces.createdAt));
  }

  /**
   * Find workspace with related projects
   * Note: This mimics Prisma's `include: { projects: true }`
   */
  async findByIdWithProjects(id: string): Promise<(Workspace & { projects: any[] }) | null> {
    const workspace = await this.findById(id);
    if (!workspace) return null;

    const relatedProjects = await db.select().from(projects).where(eq(projects.workspaceId, id));

    return {
      ...workspace,
      projects: relatedProjects,
    };
  }

  /**
   * Find workspace by name with related projects
   */
  async findByNameWithProjects(name: string): Promise<(Workspace & { projects: any[] }) | null> {
    const workspace = await this.findByName(name);
    if (!workspace) return null;

    const relatedProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspace.id));

    return {
      ...workspace,
      projects: relatedProjects,
    };
  }

  /**
   * Find workspace by ID with owner
   */
  async findByIdWithOwner(
    id: string
  ): Promise<(Workspace & { owner: { email: string | null } | null; projects: any[] }) | null> {
    const workspace = await this.findById(id);
    if (!workspace) return null;

    // Get owner email
    const [owner] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, workspace.ownerId));

    // Get projects
    const relatedProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspace.id));

    return {
      ...workspace,
      owner: owner ? { email: owner.email } : null,
      projects: relatedProjects,
    };
  }

  /**
   * Find workspace by name with owner
   */
  async findByNameWithOwner(
    name: string
  ): Promise<(Workspace & { owner: { email: string | null } | null; projects: any[] }) | null> {
    const workspace = await this.findByName(name);
    if (!workspace) return null;

    // Get owner email
    const [owner] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, workspace.ownerId));

    // Get projects
    const relatedProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspace.id));

    return {
      ...workspace,
      owner: owner ? { email: owner.email } : null,
      projects: relatedProjects,
    };
  }

  /**
   * Find all workspaces for owner with owner details
   */
  async findByOwnerWithOwner(
    ownerId: string
  ): Promise<(Workspace & { owner: { email: string | null } | null })[]> {
    const ownerWorkspaces = await this.findByOwner(ownerId);

    // Get owner email once since it's the same owner
    const [owner] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, ownerId));

    return ownerWorkspaces.map((w) => ({
      ...w,
      owner: owner ? { email: owner.email } : null,
    }));
  }

  /**
   * Find all workspaces with owner details
   */
  async findAllWithOwner(): Promise<(Workspace & { owner: { email: string | null } | null })[]> {
    const allWorkspaces = await this.findAll();

    if (allWorkspaces.length === 0) return [];

    // Fetch all owners
    const ownerIds = [...new Set(allWorkspaces.map((w) => w.ownerId))];
    const owners = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(sql`${users.id} IN ${ownerIds}`);

    const ownerMap = new Map(owners.map((o) => [o.id, { email: o.email }]));

    return allWorkspaces.map((w) => ({
      ...w,
      owner: ownerMap.get(w.ownerId) || null,
    }));
  }
}

// Export singleton instance
export const drizzleWorkspaceRepository = new DrizzleWorkspaceRepository();
