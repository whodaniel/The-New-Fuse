import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('workspaces')
@ApiTags('workspaces')
export class WorkspaceGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  @Version(['1', VERSION_NEUTRAL])
  @ApiOperation({ summary: 'Get all workspaces for the current user' })
  @ApiResponse({ status: 200, description: 'List of workspaces retrieved successfully' })
  async getAllWorkspaces(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const primaryResponse = await this.proxyService.proxyRequest(
        'agents',
        '/api/workspaces',
        'GET',
        headers,
        undefined,
        query
      );
      if (primaryResponse.status !== HttpStatus.NOT_FOUND) {
        return res.status(primaryResponse.status).json(primaryResponse.data);
      }
    } catch {
      // Fallback below handles transport errors.
    }

    try {
      const apiResponse = await this.proxyService.proxyRequest(
        'api',
        '/api/workspaces',
        'GET',
        headers,
        undefined,
        query
      );
      if (apiResponse.status !== HttpStatus.NOT_FOUND) {
        return res.status(apiResponse.status).json(apiResponse.data);
      }
    } catch {
      // Fallback below handles transport errors.
    }

    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/api/workspaces',
        'GET',
        headers,
        undefined,
        query
      );
      return res.status(response.status).json(response.data);
    } catch (fallbackError) {
      const fallbackErrorMessage =
        fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Workspace service unavailable',
        error: fallbackErrorMessage,
      });
    }
  }

  @Get('current')
  @Version(['1', VERSION_NEUTRAL])
  @ApiOperation({ summary: 'Get current workspace for current user' })
  @ApiResponse({ status: 200, description: 'Current workspace retrieved successfully' })
  async getCurrentWorkspace(@Headers() headers: Record<string, string>, @Res() res: Response) {
    try {
      const primaryResponse = await this.proxyService.proxyRequest(
        'agents',
        '/api/workspaces/current',
        'GET',
        headers
      );
      if (primaryResponse.status !== HttpStatus.NOT_FOUND) {
        return res.status(primaryResponse.status).json(primaryResponse.data);
      }
    } catch {
      // Fallback below handles transport errors.
    }

    try {
      const apiResponse = await this.proxyService.proxyRequest(
        'api',
        '/api/workspaces/current',
        'GET',
        headers
      );
      if (apiResponse.status !== HttpStatus.NOT_FOUND) {
        return res.status(apiResponse.status).json(apiResponse.data);
      }
    } catch {
      // Fallback below handles transport errors.
    }

    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/api/workspaces/current',
        'GET',
        headers
      );
      return res.status(response.status).json(response.data);
    } catch (fallbackError) {
      const fallbackErrorMessage =
        fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Workspace service unavailable',
        error: fallbackErrorMessage,
      });
    }
  }

  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Get workspace by ID' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Workspace retrieved successfully' })
  async getWorkspaceById(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}`,
      'GET',
      headers
    );
    return res.status(response.status).json(response.data);
  }

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  async createWorkspace(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      '/api/workspaces',
      'POST',
      headers,
      body
    );
    return res.status(response.status).json(response.data);
  }

  @Put(':id')
  @Version('1')
  @ApiOperation({ summary: 'Update workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully' })
  async updateWorkspace(
    @Param('id') id: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}`,
      'PUT',
      headers,
      body
    );
    return res.status(response.status).json(response.data);
  }

  @Delete(':id')
  @Version('1')
  @ApiOperation({ summary: 'Delete workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Workspace deleted successfully' })
  async deleteWorkspace(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}`,
      'DELETE',
      headers
    );
    return res.status(response.status).json(response.data);
  }

  @Get(':id/members')
  @Version('1')
  @ApiOperation({ summary: 'Get workspace members' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Workspace members retrieved successfully' })
  async getWorkspaceMembers(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/members`,
      'GET',
      headers
    );
    return res.status(response.status).json(response.data);
  }

  @Post(':id/members')
  @Version('1')
  @ApiOperation({ summary: 'Add member to workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  async addWorkspaceMember(
    @Param('id') id: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/members`,
      'POST',
      headers,
      body
    );
    return res.status(response.status).json(response.data);
  }

  @Patch(':id/members/:userId')
  @Version('1')
  @ApiOperation({ summary: 'Update workspace member role' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Member role updated successfully' })
  async updateWorkspaceMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/members/${userId}`,
      'PATCH',
      headers,
      body
    );
    return res.status(response.status).json(response.data);
  }

  @Delete(':id/members/:userId')
  @Version('1')
  @ApiOperation({ summary: 'Remove member from workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  async removeWorkspaceMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/members/${userId}`,
      'DELETE',
      headers
    );
    return res.status(response.status).json(response.data);
  }

  @Get(':id/projects')
  @Version('1')
  @ApiOperation({ summary: 'Get workspace projects' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Workspace projects retrieved successfully' })
  async getWorkspaceProjects(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/projects`,
      'GET',
      headers
    );
    return res.status(response.status).json(response.data);
  }

  @Post(':id/hostmaria/sync')
  @Version('1')
  @ApiOperation({ summary: 'Sync HostMaria legacy ops into workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Sync completed successfully' })
  async syncWorkspaceHostMariaOps(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/hostmaria/sync`,
      'POST',
      headers
    );
    return res.status(response.status).json(response.data);
  }

  @Get(':id/domains')
  @Version('1')
  @ApiOperation({ summary: 'List workspace custom domains' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Domains retrieved successfully' })
  async getWorkspaceDomains(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/domains`,
      'GET',
      headers
    );
    return res.status(response.status).json(response.data);
  }

  @Post(':id/domains')
  @Version('1')
  @ApiOperation({ summary: 'Add workspace custom domain' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 201, description: 'Domain added successfully' })
  async addWorkspaceDomain(
    @Param('id') id: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/domains`,
      'POST',
      headers,
      body
    );
    return res.status(response.status).json(response.data);
  }

  @Delete(':id/domains/:domainId')
  @Version('1')
  @ApiOperation({ summary: 'Remove workspace custom domain' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiParam({ name: 'domainId', description: 'Domain ID' })
  @ApiResponse({ status: 200, description: 'Domain removed successfully' })
  async removeWorkspaceDomain(
    @Param('id') id: string,
    @Param('domainId') domainId: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/domains/${domainId}`,
      'DELETE',
      headers
    );
    return res.status(response.status).json(response.data);
  }

  @Post(':id/domains/:domainId/verify')
  @Version('1')
  @ApiOperation({ summary: 'Verify workspace custom domain' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiParam({ name: 'domainId', description: 'Domain ID' })
  @ApiResponse({ status: 200, description: 'Domain verification triggered' })
  async verifyWorkspaceDomain(
    @Param('id') id: string,
    @Param('domainId') domainId: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/domains/${domainId}/verify`,
      'POST',
      headers
    );
    return res.status(response.status).json(response.data);
  }

  @Get(':id/bookmarks')
  @Version('1')
  @ApiOperation({ summary: 'List workspace bookmarks' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Bookmarks retrieved successfully' })
  async getWorkspaceBookmarks(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/bookmarks`,
      'GET',
      headers
    );
    return res.status(response.status).json(response.data);
  }

  @Post(':id/bookmarks')
  @Version('1')
  @ApiOperation({ summary: 'Add workspace bookmark' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 201, description: 'Bookmark added successfully' })
  async addWorkspaceBookmark(
    @Param('id') id: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/bookmarks`,
      'POST',
      headers,
      body
    );
    return res.status(response.status).json(response.data);
  }

  @Patch(':id/bookmarks/:bookmarkId')
  @Version('1')
  @ApiOperation({ summary: 'Update workspace bookmark' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiParam({ name: 'bookmarkId', description: 'Bookmark ID' })
  @ApiResponse({ status: 200, description: 'Bookmark updated successfully' })
  async updateWorkspaceBookmark(
    @Param('id') id: string,
    @Param('bookmarkId') bookmarkId: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/bookmarks/${bookmarkId}`,
      'PATCH',
      headers,
      body
    );
    return res.status(response.status).json(response.data);
  }

  @Delete(':id/bookmarks/:bookmarkId')
  @Version('1')
  @ApiOperation({ summary: 'Remove workspace bookmark' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiParam({ name: 'bookmarkId', description: 'Bookmark ID' })
  @ApiResponse({ status: 200, description: 'Bookmark removed successfully' })
  async removeWorkspaceBookmark(
    @Param('id') id: string,
    @Param('bookmarkId') bookmarkId: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/bookmarks/${bookmarkId}`,
      'DELETE',
      headers
    );
    return res.status(response.status).json(response.data);
  }

  @Get(':id/sub-access')
  @Version('1')
  @ApiOperation({ summary: 'List delegated sub-access users' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Sub-access members retrieved successfully' })
  async listWorkspaceSubAccess(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/sub-access`,
      'GET',
      headers
    );
    return res.status(response.status).json(response.data);
  }

  @Post(':id/sub-access')
  @Version('1')
  @ApiOperation({ summary: 'Grant delegated sub-access' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 201, description: 'Sub-access granted successfully' })
  async grantWorkspaceSubAccess(
    @Param('id') id: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/sub-access`,
      'POST',
      headers,
      body
    );
    return res.status(response.status).json(response.data);
  }

  @Patch(':id/sub-access/:userId')
  @Version('1')
  @ApiOperation({ summary: 'Update delegated sub-access role' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Sub-access updated successfully' })
  async updateWorkspaceSubAccess(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/sub-access/${userId}`,
      'PATCH',
      headers,
      body
    );
    return res.status(response.status).json(response.data);
  }

  @Delete(':id/sub-access/:userId')
  @Version('1')
  @ApiOperation({ summary: 'Revoke delegated sub-access' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Sub-access revoked successfully' })
  async revokeWorkspaceSubAccess(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    const response = await this.proxyService.proxyRequest(
      'agents',
      `/api/workspaces/${id}/sub-access/${userId}`,
      'DELETE',
      headers
    );
    return res.status(response.status).json(response.data);
  }
}
