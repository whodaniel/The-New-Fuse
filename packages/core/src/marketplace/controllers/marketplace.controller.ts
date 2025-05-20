/**
 * Controller for managing marketplace functionality in The New Fuse
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MarketplaceService } from '../services/marketplace.service.js';
import { MarketplaceItemType, MarketplaceItemStatus } from '../entities/marketplace-item.entity.js';
import { SubscriptionStatus } from '../entities/user-subscription.entity.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../user/entities/user.entity.js';

@ApiTags('marketplace')
@Controller('marketplace')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MarketplaceController {
  private readonly logger = new Logger(MarketplaceController.name);

  constructor(private readonly marketplaceService: MarketplaceService) {}

  // Marketplace Item Endpoints

  @Get('items')
  @ApiOperation({ summary: 'Get all marketplace items' })
  @ApiQuery({ name: 'type', required: false, enum: MarketplaceItemType, description: 'Filter by item type' })
  @ApiQuery({ name: 'featured', required: false, type: Boolean, description: 'Filter by featured status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number, starting from 1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiResponse({ status: 200, description: 'Returns a list of marketplace items' })
  async getAllItems(
    @Query('type') type?: MarketplaceItemType,
    @Query('featured') featured?: boolean,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    try {
      return await this.marketplaceService.getAllItems(type, featured, page, limit);
    } catch (error) {
      this.logger.error(`Failed to get marketplace items: ${error.message}`, error.stack);
      throw new HttpException('Failed to retrieve marketplace items', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get marketplace item by ID' })
  @ApiParam({ name: 'id', description: 'Marketplace item ID' })
  @ApiResponse({ status: 200, description: 'Returns the specified marketplace item' })
  @ApiResponse({ status: 404, description: 'Marketplace item not found' })
  async getItem(@Param('id') id: string) {
    try {
      return await this.marketplaceService.getItemById(id);
    } catch (error) {
      this.logger.error(`Failed to get marketplace item ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to retrieve marketplace item', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('items')
  @Roles(UserRole.ADMIN, UserRole.CREATOR)
  @ApiOperation({ summary: 'Create a new marketplace item' })
  @ApiBody({ description: 'Marketplace item data' })
  @ApiResponse({ status: 201, description: 'Returns the created marketplace item' })
  async createItem(@Body() itemData: any, @Request() req) {
    try {
      return await this.marketplaceService.createItem(itemData, req.user.id);
    } catch (error) {
      this.logger.error(`Failed to create marketplace item: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to create marketplace item: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('items/:id')
  @Roles(UserRole.ADMIN, UserRole.CREATOR)
  @ApiOperation({ summary: 'Update a marketplace item' })
  @ApiParam({ name: 'id', description: 'Marketplace item ID' })
  @ApiBody({ description: 'Updated marketplace item data' })
  @ApiResponse({ status: 200, description: 'Returns the updated marketplace item' })
  @ApiResponse({ status: 404, description: 'Marketplace item not found' })
  async updateItem(@Param('id') id: string, @Body() itemData: any) {
    try {
      return await this.marketplaceService.updateItem(id, itemData);
    } catch (error) {
      this.logger.error(`Failed to update marketplace item ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to update marketplace item: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('items/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a marketplace item' })
  @ApiParam({ name: 'id', description: 'Marketplace item ID' })
  @ApiResponse({ status: 200, description: 'Marketplace item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Marketplace item not found' })
  async deleteItem(@Param('id') id: string) {
    try {
      const result = await this.marketplaceService.deleteItem(id);
      return { id, deleted: result };
    } catch (error) {
      this.logger.error(`Failed to delete marketplace item ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to delete marketplace item: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Subscription Endpoints

  @Post('subscribe/:itemId')
  @ApiOperation({ summary: 'Subscribe to a marketplace item' })
  @ApiParam({ name: 'itemId', description: 'Marketplace item ID' })
  @ApiBody({ description: 'Payment details (if required)' })
  @ApiResponse({ status: 200, description: 'Subscription created successfully' })
  @ApiResponse({ status: 404, description: 'Marketplace item not found' })
  async subscribeToItem(
    @Param('itemId') itemId: string,
    @Body() paymentDetails: any,
    @Request() req
  ) {
    try {
      const subscription = await this.marketplaceService.subscribeToItem(
        req.user.id,
        itemId,
        paymentDetails
      );
      return {
        subscriptionId: subscription.id,
        itemId,
        message: 'Subscription created successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to subscribe to item ${itemId}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to subscribe to item: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('subscriptions/:subscriptionId/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiParam({ name: 'subscriptionId', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancelSubscription(@Param('subscriptionId') subscriptionId: string, @Request() req) {
    try {
      const subscription = await this.marketplaceService.cancelSubscription(
        req.user.id,
        subscriptionId
      );
      return {
        subscriptionId: subscription.id,
        itemId: subscription.itemId,
        message: 'Subscription cancelled successfully'
      };
    } catch (error) {
      this.logger.error(
        `Failed to cancel subscription ${subscriptionId}: ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to cancel subscription: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get user subscriptions' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SubscriptionStatus,
    description: 'Filter by subscription status'
  })
  @ApiResponse({ status: 200, description: 'Returns the user subscriptions' })
  async getUserSubscriptions(@Query('status') status: SubscriptionStatus, @Request() req) {
    try {
      return await this.marketplaceService.getUserSubscriptions(req.user.id, status);
    } catch (error) {
      this.logger.error(`Failed to get user subscriptions: ${error.message}`, error.stack);
      throw new HttpException('Failed to retrieve user subscriptions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('check-access/:itemId')
  @ApiOperation({ summary: 'Check if user has access to a marketplace item' })
  @ApiParam({ name: 'itemId', description: 'Marketplace item ID' })
  @ApiResponse({ status: 200, description: 'Returns access status' })
  async checkAccess(@Param('itemId') itemId: string, @Request() req) {
    try {
      return await this.marketplaceService.checkUserAccess(req.user.id, itemId);
    } catch (error) {
      this.logger.error(`Failed to check access for item ${itemId}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to check access', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Subscription Tiers

  @Get('subscription-tiers')
  @ApiOperation({ summary: 'Get available subscription tiers' })
  @ApiResponse({ status: 200, description: 'Returns the available subscription tiers' })
  async getSubscriptionTiers() {
    try {
      return await this.marketplaceService.getSubscriptionTiers();
    } catch (error) {
      this.logger.error(`Failed to get subscription tiers: ${error.message}`, error.stack);
      throw new HttpException('Failed to retrieve subscription tiers', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Admin Endpoints

  @Put('items/:id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve a marketplace item (Admin only)' })
  @ApiParam({ name: 'id', description: 'Marketplace item ID' })
  @ApiResponse({ status: 200, description: 'Marketplace item approved successfully' })
  @ApiResponse({ status: 404, description: 'Marketplace item not found' })
  async approveItem(@Param('id') id: string, @Request() req) {
    try {
      const updatedItem = await this.marketplaceService.updateItem(id, {
        status: MarketplaceItemStatus.PUBLISHED,
        approvedBy: req.user.id,
        approvedAt: new Date()
      });
      return {
        id: updatedItem.id,
        status: updatedItem.status,
        message: 'Marketplace item approved successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to approve marketplace item ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to approve marketplace item: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('items/:id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject a marketplace item (Admin only)' })
  @ApiParam({ name: 'id', description: 'Marketplace item ID' })
  @ApiBody({ description: 'Rejection reason' })
  @ApiResponse({ status: 200, description: 'Marketplace item rejected successfully' })
  @ApiResponse({ status: 404, description: 'Marketplace item not found' })
  async rejectItem(
    @Param('id') id: string,
    @Body() data: { reason: string },
    @Request() req
  ) {
    try {
      const updatedItem = await this.marketplaceService.updateItem(id, {
        status: MarketplaceItemStatus.REJECTED,
        approvedBy: req.user.id,
        approvedAt: new Date(),
        metadata: {
          ...((await this.marketplaceService.getItemById(id)).metadata || {}),
          rejectionReason: data.reason
        }
      });
      return {
        id: updatedItem.id,
        status: updatedItem.status,
        message: 'Marketplace item rejected successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to reject marketplace item ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to reject marketplace item: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('items/:id/feature')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Feature or unfeature a marketplace item (Admin only)' })
  @ApiParam({ name: 'id', description: 'Marketplace item ID' })
  @ApiBody({ description: 'Featured status' })
  @ApiResponse({ status: 200, description: 'Featured status updated successfully' })
  @ApiResponse({ status: 404, description: 'Marketplace item not found' })
  async featureItem(
    @Param('id') id: string,
    @Body() data: { featured: boolean }
  ) {
    try {
      const updatedItem = await this.marketplaceService.updateItem(id, {
        featured: data.featured
      });
      return {
        id: updatedItem.id,
        featured: updatedItem.featured,
        message: `Marketplace item ${data.featured ? 'featured' : 'unfeatured'} successfully`
      };
    } catch (error) {
      this.logger.error(
        `Failed to update featured status for marketplace item ${id}: ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to update featured status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}