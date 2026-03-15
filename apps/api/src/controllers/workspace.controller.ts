import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '@the-new-fuse/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

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
  userId!: string;
  role?: 'admin' | 'member' | 'viewer';
}

@ApiTags('workspaces')
@ApiBearerAuth()
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get all workspaces owned by the current user
   */
  @Get()
  @ApiOperation({ summary: 'Get all workspaces for the current user' })
  @ApiResponse({ status: 200, description: 'List of workspaces' })
  async getAllWorkspaces(@CurrentUser() user: { id: string }) {
    const owned = await this.db.workspaces.findByOwnerWithOwner(user.id);
    const memberRows = await this.db.workspaceMembers.listByUser(user.id);
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

  /**
   * Get workspace by ID
   * Only accessible by the workspace owner
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  @ApiResponse({ status: 200, description: 'Workspace details' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getWorkspaceById(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    const workspace = await this.db.workspaces.findByIdWithOwner(id);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.db.workspaceMembers.findMembership(id, user.id);
    if (workspace.ownerId !== user.id && !membership) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

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
    @CurrentUser() user: { id: string }
  ) {
    const workspace = await this.db.workspaces.create({
      name: workspaceData.name,
      description: workspaceData.description,
      ownerId: user.id,
    });

    await this.db.workspaceMembers.upsertMember({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
      addedByUserId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return workspace;
  }

  /**
   * Update workspace
   * Only the owner can update the workspace
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update workspace' })
  @ApiResponse({ status: 200, description: 'Workspace updated' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async updateWorkspace(
    @Param('id') id: string,
    @Body() workspaceData: UpdateWorkspaceDto,
    @CurrentUser() user: { id: string }
  ) {
    // Verify ownership
    const existingWorkspace = await this.db.workspaces.findById(id);

    if (!existingWorkspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.db.workspaceMembers.findMembership(id, user.id);
    const isOwner = existingWorkspace.ownerId === user.id;
    const isAdmin = membership?.role === 'admin' || membership?.role === 'owner';

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
  async deleteWorkspace(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    // Verify ownership
    const existingWorkspace = await this.db.workspaces.findById(id);

    if (!existingWorkspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (existingWorkspace.ownerId !== user.id) {
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
  async getWorkspaceMembers(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    // Verify workspace exists and user has access
    const workspace = await this.db.workspaces.findByIdWithOwner(id);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.db.workspaceMembers.findMembership(id, user.id);
    if (workspace.ownerId !== user.id && !membership) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    const members = await this.db.workspaceMembers.listByWorkspaceWithUsers(id);
    const hasOwner = members.some((member) => member.userId === workspace.ownerId);

    const formatted = members.map((member) => ({
      userId: member.userId,
      email: member.userEmail,
      role: member.role,
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

  /**
   * Add member to workspace
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
    @CurrentUser() user: { id: string }
  ) {
    // Verify workspace exists and user is owner
    const workspace = await this.db.workspaces.findById(id);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.db.workspaceMembers.findMembership(id, user.id);
    const isOwner = workspace.ownerId === user.id;
    const isAdmin = membership?.role === 'admin' || membership?.role === 'owner';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Only workspace owners or admins can add members');
    }

    const targetUser = await this.db.users.findById(memberData.userId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const role = memberData.role || 'member';
    const member = await this.db.workspaceMembers.upsertMember({
      workspaceId: id,
      userId: memberData.userId,
      role,
      addedByUserId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      message: 'Workspace member added',
      member,
    };
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
    // Verify workspace exists and user is owner
    const workspace = await this.db.workspaces.findById(id);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.db.workspaceMembers.findMembership(id, userId);
    const isOwner = workspace.ownerId === userId;
    const isAdmin = membership?.role === 'admin' || membership?.role === 'owner';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Only workspace owners or admins can remove members');
    }

    // Cannot remove the owner
    if (memberUserId === workspace.ownerId) {
      throw new ForbiddenException('Cannot remove the workspace owner. Transfer ownership first.');
    }

    const removed = await this.db.workspaceMembers.removeMember(id, memberUserId);
    if (!removed) {
      throw new NotFoundException('Workspace member not found');
    }

    return {
      message: 'Workspace member removed',
      memberId: memberUserId,
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
    // Verify workspace exists and user has access
    const workspace = await this.db.workspaces.findById(id);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.db.workspaceMembers.findMembership(id, userId);
    if (workspace.ownerId !== userId && !membership) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    const workspaceWithProjects = await this.db.workspaces.findByIdWithProjects(id);

    return workspaceWithProjects?.projects || [];
  }
}
