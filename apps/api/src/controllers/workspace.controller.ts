import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DatabaseService } from '@the-new-fuse/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

/**
 * DTO for creating a new workspace
 */
export class CreateWorkspaceDto {
  name: string;
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
  userId: string;
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
    const workspaces = await this.db.workspaces.findByOwnerWithOwner(user.id);
    return workspaces;
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

    // Only allow owner to access
    if (workspace.ownerId !== user.id) {
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
    @CurrentUser() user: { id: string },
  ) {
    const workspace = await this.db.workspaces.create({
      name: workspaceData.name,
      description: workspaceData.description,
      ownerId: user.id,
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
    @CurrentUser() user: { id: string },
  ) {
    // Verify ownership
    const existingWorkspace = await this.db.workspaces.findById(id);
    
    if (!existingWorkspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (existingWorkspace.ownerId !== user.id) {
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
   * NOTE: This requires a workspace_members table which does not exist yet.
   * Currently returns the owner as the only member.
   * 
   * TODO: Implement proper workspace membership system:
   * 1. Create workspace_members table in schema:
   *    - id: uuid (PK)
   *    - workspaceId: uuid (FK -> workspaces.id)
   *    - userId: uuid (FK -> users.id)
   *    - role: enum ('owner', 'admin', 'member', 'viewer')
   *    - addedAt: timestamp
   *    - addedBy: uuid (FK -> users.id)
   * 2. Create DrizzleWorkspaceMemberRepository
   * 3. Add workspaceMembers accessor to DatabaseService
   * 4. Implement full member management
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

    if (workspace.ownerId !== user.id) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Return owner as the only member until membership table is created
    return [
      {
        userId: workspace.ownerId,
        email: workspace.owner?.email,
        role: 'owner',
        joinedAt: workspace.createdAt,
      },
    ];
  }

  /**
   * Add member to workspace
   * NOTE: This requires a workspace_members table which does not exist yet.
   * 
   * TODO: Implement after creating workspace_members table (see getWorkspaceMembers TODO)
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
    @CurrentUser() user: { id: string },
  ) {
    // Verify workspace exists and user is owner
    const workspace = await this.db.workspaces.findById(id);
    
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId !== user.id) {
      throw new ForbiddenException('Only the workspace owner can add members');
    }

    // TODO: Implement when workspace_members table exists
    // For now, return a message indicating the feature is not yet implemented
    return {
      message: 'Workspace member management is not yet implemented',
      note: 'A workspace_members table needs to be created in the database schema. See controller source for TODO details.',
      requestedMember: memberData.userId,
      requestedRole: memberData.role || 'member',
    };
  }

  /**
   * Remove member from workspace
   * NOTE: This requires a workspace_members table which does not exist yet.
   * 
   * TODO: Implement after creating workspace_members table (see getWorkspaceMembers TODO)
   */
  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from workspace' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  @ApiResponse({ status: 404, description: 'Workspace or member not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async removeWorkspaceMember(
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
    @CurrentUser('id') userId: string,
  ) {
    // Verify workspace exists and user is owner
    const workspace = await this.db.workspaces.findById(id);
    
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can remove members');
    }

    // Cannot remove the owner
    if (memberUserId === workspace.ownerId) {
      throw new ForbiddenException('Cannot remove the workspace owner. Transfer ownership first.');
    }

    // TODO: Implement when workspace_members table exists
    return {
      message: 'Workspace member management is not yet implemented',
      note: 'A workspace_members table needs to be created in the database schema. See controller source for TODO details.',
      requestedRemoval: memberUserId,
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

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    const workspaceWithProjects = await this.db.workspaces.findByIdWithProjects(id);
    
    return workspaceWithProjects?.projects || [];
  }
}
