import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtAuth, SecureAuthGuard } from '../../guards/secure-auth.guard';
import {
  CreateSpaceDto,
  RegisterSpaceAssetDto,
  UpdateSpaceDto,
  UpsertSpaceRouteDto,
} from './dto/spaces.dto';
import { SpacesService } from './spaces.service';

/**
 * TNF Hosted Spaces — parity target: Zo Computer's zo.space.
 * See docs/TNF_HOSTED_SPACES_ARCHITECTURE.md for the full design.
 */
@ApiTags('spaces')
@ApiBearerAuth()
@UseGuards(SecureAuthGuard)
@JwtAuth()
@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new hosted space' })
  createSpace(@CurrentUser('id') userId: string, @Body() dto: CreateSpaceDto) {
    return this.spacesService.createSpace(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List spaces owned by the current user' })
  listSpaces(@CurrentUser('id') userId: string) {
    return this.spacesService.listSpacesForUser(userId);
  }

  @Get(':spaceId')
  @ApiOperation({ summary: 'Get a space by id' })
  getSpace(@CurrentUser('id') userId: string, @Param('spaceId') spaceId: string) {
    return this.spacesService.getSpace(userId, spaceId);
  }

  @Patch(':spaceId')
  @ApiOperation({ summary: 'Update space metadata (name, plan, status, custom domains)' })
  updateSpace(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
    @Body() dto: UpdateSpaceDto
  ) {
    return this.spacesService.updateSpace(userId, spaceId, dto);
  }

  @Delete(':spaceId')
  @ApiOperation({ summary: 'Delete a space and all of its routes/assets' })
  deleteSpace(@CurrentUser('id') userId: string, @Param('spaceId') spaceId: string) {
    return this.spacesService.deleteSpace(userId, spaceId);
  }

  @Post(':spaceId/routes')
  @ApiOperation({
    summary: 'Create or replace a route at a given path (upsert, like Zo write_space_route)',
  })
  upsertRoute(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
    @Body() dto: UpsertSpaceRouteDto
  ) {
    return this.spacesService.upsertRoute(userId, spaceId, dto);
  }

  @Get(':spaceId/routes')
  @ApiOperation({ summary: 'List all routes in a space' })
  listRoutes(@CurrentUser('id') userId: string, @Param('spaceId') spaceId: string) {
    return this.spacesService.listRoutes(userId, spaceId);
  }

  @Get(':spaceId/routes/:routeId')
  @ApiOperation({ summary: 'Get a single route by id' })
  getRoute(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
    @Param('routeId') routeId: string
  ) {
    return this.spacesService.getRoute(userId, spaceId, routeId);
  }

  @Delete(':spaceId/routes/:routeId')
  @ApiOperation({ summary: 'Delete a route' })
  deleteRoute(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
    @Param('routeId') routeId: string
  ) {
    return this.spacesService.deleteRoute(userId, spaceId, routeId);
  }

  @Post(':spaceId/assets')
  @ApiOperation({
    summary: 'Register asset metadata after the binary has been written to storage',
  })
  registerAsset(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
    @Body() dto: RegisterSpaceAssetDto
  ) {
    return this.spacesService.registerAsset(userId, spaceId, dto);
  }

  @Get(':spaceId/assets')
  @ApiOperation({ summary: 'List assets in a space' })
  listAssets(@CurrentUser('id') userId: string, @Param('spaceId') spaceId: string) {
    return this.spacesService.listAssets(userId, spaceId);
  }

  @Delete(':spaceId/assets/:assetId')
  @ApiOperation({ summary: 'Delete an asset' })
  deleteAsset(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
    @Param('assetId') assetId: string
  ) {
    return this.spacesService.deleteAsset(userId, spaceId, assetId);
  }
}
