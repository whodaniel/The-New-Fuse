import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '@the-new-fuse/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

type WorkspaceAccessRole = 'owner' | 'admin' | 'member' | 'viewer';
type WorkspaceManageableRole = Exclude<WorkspaceAccessRole, 'owner'>;

/**
 * DTO for creating a new workspace
 */
export class CreateWorkspaceDto {
  name!: string;
  description?: string;
}

/**
 * DTO for updating a workspace
 */
export class UpdateWorkspaceDto {
  name?: string;
  description?: string;
}

/**
 * DTO for adding a workspace member
 */
export class AddWorkspaceMemberDto {
  userId?: string;
  email?: string;
  role?: WorkspaceManageableRole;
}

/**
 * DTO for updating a workspace member role
 */
export class UpdateWorkspaceMemberRoleDto {
  role!: WorkspaceManageableRole;
}

/**
 * DTO for setting delegated sub-access (VA access)
 */
export class SetWorkspaceSubAccessDto extends AddWorkspaceMemberDto {}

/**
 * DTO for updating delegated sub-access (VA access)
 */
export class UpdateWorkspaceSubAccessDto extends UpdateWorkspaceMemberRoleDto {}

interface WorkspaceWithOwner {
  id: string;
  ownerId: string;
  createdAt: Date;
  owner: { email: string | null } | null;
}

interface WorkspaceMemberView {
  userId: string;
  email: string | null;
  role: WorkspaceAccessRole;
  joinedAt: Date;
}

@ApiTags('workspaces')
@ApiBearerAuth()
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly db: DatabaseService) {}

  private normalizeRole(role?: string): WorkspaceManageableRole {
    return role === 'admin' || role === 'member' || role === 'viewer' ? role : 'member';
  }

  private async listAccessibleWorkspaces(userId: string) {
    const owned = await this.db.workspaces.findByOwnerWithOwner(userId);
    const memberRows = await this.db.workspaceMembers.listByUser(userId);
    const ownedIds = new Set(owned.map((workspace) => workspace.id));
    const memberIds = memberRows.map((row) => row.workspaceId).filter((id) => !ownedIds.has(id));
    const memberWorkspaces = await this.db.workspaces.findByIdsWithOwner(memberIds);
    const roleByWorkspace = new Map(memberRows.map((row) => [row.workspaceId, row.role]));

    return [
      ...owned.map((workspace) => ({ ...workspace, membershipRole: 'owner' })),
      ...memberWorkspaces.map((workspace) => ({
        ...workspace,
        membershipRole: roleByWorkspace.get(workspace.id) || 'member',
      })),
    ];
  }

  private async ensureWorkspaceAccess(workspaceId: string, userId: string) {
    const workspace = (await this.db.workspaces.findByIdWithOwner(
      workspaceId
    )) as WorkspaceWithOwner;
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.db.workspaceMembers.findMembership(workspaceId, userId);
    const isOwner = workspace.ownerId === userId;
    const isAdmin = membership?.role === 'admin' || membership?.role === 'owner';
    if (!isOwner && !membership) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    return { workspace, membership, isOwner, isAdmin };
  }

  private async ensureWorkspaceMemberManagement(workspaceId: string, userId: string) {
    const access = await this.ensureWorkspaceAccess(workspaceId, userId);
    if (!access.isOwner && !access.isAdmin) {
      throw new ForbiddenException('Only workspace owners or admins can manage members');
    }
    return access;
  }

  private async resolveTargetUserId(memberData: AddWorkspaceMemberDto): Promise<string> {
    if (memberData.userId?.trim()) {
      const existingById = await this.db.users.findById(memberData.userId.trim());
      if (!existingById) {
        throw new NotFoundException('User not found');
      }
      return existingById.id;
    }

    if (memberData.email?.trim()) {
      const normalizedEmail = memberData.email.trim().toLowerCase();
      const existingByEmail = await this.db.users.findByEmail(normalizedEmail);
      if (!existingByEmail) {
        throw new NotFoundException(
          'User with this email was not found. Ask them to create an account first.'
        );
      }
      return existingByEmail.id;
    }

    throw new BadRequestException('Either userId or email is required');
  }

  private async listWorkspaceMembersInternal(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceMemberView[]> {
    const { workspace } = await this.ensureWorkspaceAccess(workspaceId, userId);
    const members = await this.db.workspaceMembers.listByWorkspaceWithUsers(workspaceId);
    const hasOwner = members.some((member) => member.userId === workspace.ownerId);

    const formatted: WorkspaceMemberView[] = members.map((member) => ({
      userId: member.userId,
      email: member.userEmail,
      role: member.role as WorkspaceAccessRole,
      joinedAt: member.createdAt,
    }));

    if (!hasOwner) {
      formatted.unshift({
        userId: workspace.ownerId,
        email: workspace.owner?.email ?? null,
        role: 'owner',
        joinedAt: workspace.createdAt,
      });
    }

    return formatted;
  }

  private async addWorkspaceMemberInternal(
    workspaceId: string,
    memberData: AddWorkspaceMemberDto,
    actingUserId: string
  ) {
    const { workspace } = await this.ensureWorkspaceMemberManagement(workspaceId, actingUserId);
    const targetUserId = await this.resolveTargetUserId(memberData);

    if (targetUserId === workspace.ownerId) {
      throw new ForbiddenException('Workspace owner already has full access');
    }

    const role = this.normalizeRole(memberData.role);
    const member = await this.db.workspaceMembers.upsertMember({
      workspaceId,
      userId: targetUserId,
      role,
      addedByUserId: actingUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const targetUser = await this.db.users.findById(targetUserId);

    return {
      message: 'Workspace member added',
      member: {
        userId: member.userId,
        email: targetUser?.email ?? null,
        role: member.role,
        joinedAt: member.createdAt,
      },
    };
  }

  private async updateWorkspaceMemberRoleInternal(
    workspaceId: string,
    memberUserId: string,
    roleData: UpdateWorkspaceMemberRoleDto,
    actingUserId: string
  ) {
    const { workspace } = await this.ensureWorkspaceMemberManagement(workspaceId, actingUserId);
    if (memberUserId === workspace.ownerId) {
      throw new ForbiddenException('Cannot change role for the workspace owner');
    }

    const existingMember = await this.db.workspaceMembers.findMembership(workspaceId, memberUserId);
    if (!existingMember) {
      throw new NotFoundException('Workspace member not found');
    }

    const role = this.normalizeRole(roleData.role);
    const updatedMember = await this.db.workspaceMembers.updateRole(
      workspaceId,
      memberUserId,
      role
    );
    if (!updatedMember) {
      throw new NotFoundException('Workspace member not found');
    }

    const targetUser = await this.db.users.findById(memberUserId);

    return {
      message: 'Workspace member role updated',
      member: {
        userId: updatedMember.userId,
        email: targetUser?.email ?? null,
        role: updatedMember.role,
        joinedAt: updatedMember.createdAt,
      },
    };
  }

  private async removeWorkspaceMemberInternal(
    workspaceId: string,
    memberUserId: string,
    actingUserId: string
  ) {
    const { workspace } = await this.ensureWorkspaceMemberManagement(workspaceId, actingUserId);
    if (memberUserId === workspace.ownerId) {
      throw new ForbiddenException('Cannot remove the workspace owner. Transfer ownership first.');
    }

    const removed = await this.db.workspaceMembers.removeMember(workspaceId, memberUserId);
    if (!removed) {
      throw new NotFoundException('Workspace member not found');
    }

    return {
      message: 'Workspace member removed',
      memberId: memberUserId,
    };
  }

  /**
   * Get all workspaces accessible by the current user
   */
  @Get()
  @ApiOperation({ summary: 'Get all workspaces for the current user' })
  @ApiResponse({ status: 200, description: 'List of workspaces' })
  async getAllWorkspaces(@CurrentUser('id') userId: string) {
    return this.listAccessibleWorkspaces(userId);
  }

  /**
   * Get current workspace for user.
   * Uses first accessible workspace as default current workspace.
   */
  @Get('current')
  @ApiOperation({ summary: 'Get current workspace for current user' })
  @ApiResponse({ status: 200, description: 'Current workspace' })
  @ApiResponse({ status: 404, description: 'No workspace found for user' })
  async getCurrentWorkspace(@CurrentUser('id') userId: string) {
    const workspaces = await this.listAccessibleWorkspaces(userId);
    if (workspaces.length === 0) {
      throw new NotFoundException('No workspace found for current user');
    }
    return workspaces[0];
  }

  /**
   * Get workspace by ID
   * Accessible by workspace owner or members
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  @ApiResponse({ status: 200, description: 'Workspace details' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getWorkspaceById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const { workspace } = await this.ensureWorkspaceAccess(id, userId);
    return workspace;
  }

  /**
   * Create a new workspace
   * The current user becomes the owner
   */
  @Post()
  @ApiOperation({ summary: 'Create new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created' })
  @HttpCode(HttpStatus.CREATED)
  async createWorkspace(
    @Body() workspaceData: CreateWorkspaceDto,
    @CurrentUser('id') userId: string
  ) {
    const workspace = await this.db.workspaces.create({
      name: workspaceData.name,
      description: workspaceData.description,
      ownerId: userId,
    });

    await this.db.workspaceMembers.upsertMember({
      workspaceId: workspace.id,
      userId,
      role: 'owner',
      addedByUserId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return workspace;
  }

  /**
   * Update workspace
   * Accessible by workspace owner and admins
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update workspace' })
  @ApiResponse({ status: 200, description: 'Workspace updated' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async updateWorkspace(
    @Param('id') id: string,
    @Body() workspaceData: UpdateWorkspaceDto,
    @CurrentUser('id') userId: string
  ) {
    const { isOwner, isAdmin } = await this.ensureWorkspaceAccess(id, userId);
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to update this workspace');
    }

    const updatedWorkspace = await this.db.workspaces.update(id, {
      name: workspaceData.name,
      description: workspaceData.description,
    });

    return updatedWorkspace;
  }

  /**
   * Delete workspace
   * Only the owner can delete the workspace
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete workspace' })
  @ApiResponse({ status: 200, description: 'Workspace deleted' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async deleteWorkspace(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const existingWorkspace = await this.db.workspaces.findById(id);
    if (!existingWorkspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (existingWorkspace.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this workspace');
    }

    const deleted = await this.db.workspaces.delete(id);
    if (!deleted) {
      throw new NotFoundException('Workspace not found');
    }

    return { message: 'Workspace deleted successfully', id };
  }

  /**
   * Get workspace members
   */
  @Get(':id/members')
  @ApiOperation({ summary: 'Get workspace members' })
  @ApiResponse({ status: 200, description: 'List of workspace members' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async getWorkspaceMembers(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.listWorkspaceMembersInternal(id, userId);
  }

  /**
   * Add member to workspace by userId or email
   */
  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to workspace' })
  @ApiResponse({ status: 201, description: 'Member added' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @HttpCode(HttpStatus.CREATED)
  async addWorkspaceMember(
    @Param('id') id: string,
    @Body() memberData: AddWorkspaceMemberDto,
    @CurrentUser('id') userId: string
  ) {
    return this.addWorkspaceMemberInternal(id, memberData, userId);
  }

  /**
   * Update member role in workspace
   */
  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Update workspace member role' })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  @ApiResponse({ status: 404, description: 'Workspace or member not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async updateWorkspaceMemberRole(
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
    @Body() roleData: UpdateWorkspaceMemberRoleDto,
    @CurrentUser('id') userId: string
  ) {
    return this.updateWorkspaceMemberRoleInternal(id, memberUserId, roleData, userId);
  }

  /**
   * Remove member from workspace
   */
  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from workspace' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  @ApiResponse({ status: 404, description: 'Workspace or member not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async removeWorkspaceMember(
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.removeWorkspaceMemberInternal(id, memberUserId, userId);
  }

  /**
   * List delegated sub-access users (non-owner members), useful for VA management UIs.
   */
  @Get(':id/sub-access')
  @ApiOperation({ summary: 'List delegated sub-access users for workspace' })
  @ApiResponse({ status: 200, description: 'List of delegated users and access levels' })
  async listWorkspaceSubAccess(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const members = await this.listWorkspaceMembersInternal(id, userId);
    return {
      workspaceId: id,
      members: members
        .filter((member) => member.role !== 'owner')
        .map((member) => ({
          ...member,
          accessLevel: member.role,
        })),
    };
  }

  /**
   * Grant delegated sub-access (VA access) using email or userId.
   */
  @Post(':id/sub-access')
  @ApiOperation({ summary: 'Grant delegated sub-access to workspace' })
  @ApiResponse({ status: 201, description: 'Sub-access granted' })
  @HttpCode(HttpStatus.CREATED)
  async grantWorkspaceSubAccess(
    @Param('id') id: string,
    @Body() accessData: SetWorkspaceSubAccessDto,
    @CurrentUser('id') userId: string
  ) {
    const result = await this.addWorkspaceMemberInternal(id, accessData, userId);
    return {
      message: 'Sub-access granted',
      member: result.member,
      accessLevel: result.member.role,
    };
  }

  /**
   * Update delegated sub-access role.
   */
  @Patch(':id/sub-access/:userId')
  @ApiOperation({ summary: 'Update delegated sub-access level' })
  @ApiResponse({ status: 200, description: 'Sub-access updated' })
  async updateWorkspaceSubAccess(
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
    @Body() accessData: UpdateWorkspaceSubAccessDto,
    @CurrentUser('id') userId: string
  ) {
    const result = await this.updateWorkspaceMemberRoleInternal(
      id,
      memberUserId,
      accessData,
      userId
    );
    return {
      message: 'Sub-access updated',
      member: result.member,
      accessLevel: result.member.role,
    };
  }

  /**
   * Revoke delegated sub-access.
   */
  @Delete(':id/sub-access/:userId')
  @ApiOperation({ summary: 'Revoke delegated sub-access' })
  @ApiResponse({ status: 200, description: 'Sub-access revoked' })
  async revokeWorkspaceSubAccess(
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
    @CurrentUser('id') userId: string
  ) {
    const result = await this.removeWorkspaceMemberInternal(id, memberUserId, userId);
    return {
      message: 'Sub-access revoked',
      memberId: result.memberId,
    };
  }

  /**
   * Get all projects in a workspace
   */
  @Get(':id/projects')
  @ApiOperation({ summary: 'Get workspace projects' })
  @ApiResponse({ status: 200, description: 'List of projects in the workspace' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getWorkspaceProjects(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.ensureWorkspaceAccess(id, userId);
    const workspaceWithProjects = await this.db.workspaces.findByIdWithProjects(id);
    return workspaceWithProjects?.projects || [];
  }
}
