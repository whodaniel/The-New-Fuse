import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResourceRegistryService } from '../services/resource-registry.service';
import { ResourceAccessControlService, AccessContext } from '../services/resource-access-control.service';
import { CreateResourceDto, UpdateResourceDto, SearchResourceDto } from '../dto';
import { Resource, SearchResult, ResourceAction } from '../types';

// Import authentication guards - use service or user auth to support both
// JWT tokens (users) and API keys (services/agents)
import { ServiceOrUserAuthGuard } from '../guards/service-or-user-auth.guard';

/**
 * Resource Registry Controller
 *
 * Manages resource CRUD operations, versioning, and access control.
 * All endpoints require authentication via JWT token or API key.
 *
 * @security ServiceOrUserAuth - Supports both JWT (users) and API key (services)
 * @see ServiceOrUserAuthGuard
 */
@ApiTags('Resources')
@Controller('api/resources')
@UseGuards(ServiceOrUserAuthGuard)
@ApiBearerAuth()
export class ResourceRegistryController {
  private readonly logger = new Logger(ResourceRegistryController.name);

  constructor(
    private readonly resourceService: ResourceRegistryService,
    private readonly accessControl: ResourceAccessControlService,
  ) {}

  /**
   * Create a new resource
   *
   * Creates a new resource in the registry. Requires authentication.
   * Access control is enforced based on user/agent permissions.
   *
   * @requires Authentication
   * @security ServiceOrUserAuth
   */
  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  @ApiResponse({ status: 201, description: 'Resource created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateResourceDto,
    @Req() request?: any,
  ): Promise<Resource> {
    this.logger.log(`Creating resource: ${createDto.name}`);

    const resource = await this.resourceService.create(createDto);

    // Log access
    const context = this.extractAccessContext(request);
    await this.resourceService.logAccess(
      resource.id,
      ResourceAction.UPDATE,
      context.userId || context.agentId,
      context.isAgent ? 'agent' : 'user',
    );

    return resource;
  }

  /**
   * Search and list resources
   *
   * Retrieves resources based on search criteria. Results are filtered
   * based on user/agent access permissions.
   *
   * @requires Authentication
   * @security ServiceOrUserAuth
   */
  @Get()
  @ApiOperation({ summary: 'Search and list resources' })
  @ApiResponse({ status: 200, description: 'Resources retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async search(
    @Query() searchDto: SearchResourceDto,
    @Req() request?: any,
  ): Promise<SearchResult<Resource>> {
    this.logger.log('Searching resources');

    const result = await this.resourceService.search(searchDto);

    // Filter by access permissions
    const context = this.extractAccessContext(request);
    const filteredData = this.accessControl.filterByAccess(result.data, context);

    return {
      ...result,
      data: filteredData,
      total: filteredData.length,
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all resource categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories(): Promise<string[]> {
    this.logger.log('Getting categories');
    return this.resourceService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a resource by ID' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiResponse({ status: 200, description: 'Resource retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findById(
    @Param('id') id: string,
    @Req() request?: any,
  ): Promise<Resource> {
    this.logger.log(`Getting resource: ${id}`);

    const resource = await this.resourceService.findById(id);

    // Check access permissions
    const context = this.extractAccessContext(request);
    this.accessControl.assertCanView(resource, context);

    // Log access
    await this.resourceService.logAccess(
      resource.id,
      ResourceAction.VIEW,
      context.userId || context.agentId,
      context.isAgent ? 'agent' : 'user',
    );

    return resource;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a resource' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiResponse({ status: 200, description: 'Resource updated successfully' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateResourceDto,
    @Req() request?: any,
  ): Promise<Resource> {
    this.logger.log(`Updating resource: ${id}`);

    const existingResource = await this.resourceService.findById(id);

    // Check access permissions
    const context = this.extractAccessContext(request);
    this.accessControl.assertCanModify(existingResource, context);

    const resource = await this.resourceService.update(id, updateDto);

    // Log access
    await this.resourceService.logAccess(
      resource.id,
      ResourceAction.UPDATE,
      context.userId || context.agentId,
      context.isAgent ? 'agent' : 'user',
    );

    return resource;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resource' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiResponse({ status: 204, description: 'Resource deleted successfully' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @Req() request?: any,
  ): Promise<void> {
    this.logger.log(`Deleting resource: ${id}`);

    const existingResource = await this.resourceService.findById(id);

    // Check access permissions
    const context = this.extractAccessContext(request);
    this.accessControl.assertCanDelete(existingResource, context);

    await this.resourceService.delete(id);

    // Log access
    await this.resourceService.logAccess(
      id,
      ResourceAction.DELETE,
      context.userId || context.agentId,
      context.isAgent ? 'agent' : 'user',
    );
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a resource' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiResponse({ status: 200, description: 'Versions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async getVersions(
    @Param('id') id: string,
    @Req() request?: any,
  ): Promise<any[]> {
    this.logger.log(`Getting versions for resource: ${id}`);

    const resource = await this.resourceService.findById(id);

    // Check access permissions
    const context = this.extractAccessContext(request);
    this.accessControl.assertCanView(resource, context);

    return this.resourceService.getVersions(id);
  }

  @Get(':id/versions/:version')
  @ApiOperation({ summary: 'Get a specific version of a resource' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiParam({ name: 'version', description: 'Version number' })
  @ApiResponse({ status: 200, description: 'Version retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Resource or version not found' })
  async getVersion(
    @Param('id') id: string,
    @Param('version') version: string,
    @Req() request?: any,
  ): Promise<any> {
    this.logger.log(`Getting version ${version} for resource: ${id}`);

    const resource = await this.resourceService.findById(id);

    // Check access permissions
    const context = this.extractAccessContext(request);
    this.accessControl.assertCanView(resource, context);

    return this.resourceService.getVersion(id, version);
  }

  @Post(':id/download')
  @ApiOperation({ summary: 'Download a resource (logs download count)' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiResponse({ status: 200, description: 'Resource content returned' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async download(
    @Param('id') id: string,
    @Req() request?: any,
  ): Promise<any> {
    this.logger.log(`Downloading resource: ${id}`);

    const resource = await this.resourceService.findById(id);

    // Check access permissions
    const context = this.extractAccessContext(request);
    this.accessControl.assertCanExecute(resource, context);

    // Log download
    await this.resourceService.logAccess(
      resource.id,
      ResourceAction.DOWNLOAD,
      context.userId || context.agentId,
      context.isAgent ? 'agent' : 'user',
    );

    return {
      id: resource.id,
      name: resource.name,
      version: resource.version,
      content: resource.content,
      type: resource.type,
      category: resource.category,
    };
  }

  // Private helper methods

  private extractAccessContext(request: any): AccessContext {
    // Extract user/agent information from request
    // This should be populated by authentication middleware
    const user = request?.user;
    const agent = request?.agent;

    return {
      userId: user?.id,
      agentId: agent?.id,
      isAgent: !!agent,
      isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
      roles: user?.roles || [],
    };
  }
}
