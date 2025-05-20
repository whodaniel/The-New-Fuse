/**
 * Service for managing the integration marketplace in The New Fuse
 */
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketplaceItemRepository } from '../repositories/marketplace-item.repository.js';
import { UserSubscriptionRepository } from '../repositories/user-subscription.repository.js';
import { IntegrationRegistryService } from '../../integration/services/integration-registry.service.js';
import { PaymentService } from '../../payment/services/payment.service.js';
import { UserService } from '../../user/services/user.service.js';
import { MarketplaceItem, MarketplaceItemType, PricingModel } from '../entities/marketplace-item.entity.js';
import { UserSubscription, SubscriptionStatus } from '../entities/user-subscription.entity.js';
import { User } from '../../user/entities/user.entity.js';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly marketplaceItemRepository: MarketplaceItemRepository,
    private readonly userSubscriptionRepository: UserSubscriptionRepository,
    private readonly integrationRegistry: IntegrationRegistryService,
    private readonly paymentService: PaymentService,
    private readonly userService: UserService
  ) {}

  /**
   * Get all marketplace items
   */
  async getAllItems(
    type?: MarketplaceItemType,
    featured?: boolean,
    page = 1,
    limit = 20
  ): Promise<{ items: MarketplaceItem[]; total: number }> {
    const filter: any = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (featured !== undefined) {
      filter.featured = featured;
    }
    
    const [items, total] = await this.marketplaceItemRepository.findAndCount(
      filter,
      { page, limit, sort: { featured: 'DESC', createdAt: 'DESC' } }
    );
    
    return { items, total };
  }

  /**
   * Get marketplace item by ID
   */
  async getItemById(id: string): Promise<MarketplaceItem> {
    const item = await this.marketplaceItemRepository.findById(id);
    
    if (!item) {
      throw new NotFoundException(`Marketplace item with ID ${id} not found`);
    }
    
    return item;
  }

  /**
   * Create a new marketplace item
   */
  async createItem(itemData: Partial<MarketplaceItem>, creatorId: string): Promise<MarketplaceItem> {
    // Verify the creator exists
    const creator = await this.userService.findUserById(creatorId);
    if (!creator) {
      throw new NotFoundException(`Creator with ID ${creatorId} not found`);
    }
    
    // If this is an integration, verify it exists in the registry
    if (itemData.type === MarketplaceItemType.INTEGRATION && itemData.integrationId) {
      const integration = this.integrationRegistry.getIntegration(itemData.integrationId);
      if (!integration) {
        throw new NotFoundException(`Integration with ID ${itemData.integrationId} not found`);
      }
    }
    
    // Create the new marketplace item
    const newItem = await this.marketplaceItemRepository.create({
      ...itemData,
      creatorId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    this.logger.log(`Created new marketplace item: ${newItem.id} - ${newItem.name}`);
    
    return newItem;
  }

  /**
   * Update a marketplace item
   */
  async updateItem(id: string, itemData: Partial<MarketplaceItem>): Promise<MarketplaceItem> {
    const existingItem = await this.getItemById(id);
    
    // If changing integration ID, verify it exists
    if (
      itemData.type === MarketplaceItemType.INTEGRATION && 
      itemData.integrationId && 
      itemData.integrationId !== existingItem.integrationId
    ) {
      const integration = this.integrationRegistry.getIntegration(itemData.integrationId);
      if (!integration) {
        throw new NotFoundException(`Integration with ID ${itemData.integrationId} not found`);
      }
    }
    
    // Update the item
    const updatedItem = await this.marketplaceItemRepository.update(id, {
      ...itemData,
      updatedAt: new Date()
    });
    
    this.logger.log(`Updated marketplace item: ${id}`);
    
    return updatedItem;
  }

  /**
   * Delete a marketplace item
   */
  async deleteItem(id: string): Promise<boolean> {
    const existingItem = await this.getItemById(id);
    
    // Check if there are active subscriptions to this item
    const activeSubscriptions = await this.userSubscriptionRepository.findByItemId(id, {
      status: SubscriptionStatus.ACTIVE
    });
    
    if (activeSubscriptions.length > 0) {
      throw new BadRequestException(
        `Cannot delete marketplace item with ${activeSubscriptions.length} active subscriptions`
      );
    }
    
    await this.marketplaceItemRepository.delete(id);
    
    this.logger.log(`Deleted marketplace item: ${id}`);
    
    return true;
  }

  /**
   * Subscribe a user to a marketplace item
   */
  async subscribeToItem(
    userId: string,
    itemId: string,
    paymentDetails?: any
  ): Promise<UserSubscription> {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    const item = await this.getItemById(itemId);
    
    // Check if user already has an active subscription
    const existingSubscription = await this.userSubscriptionRepository.findOne({
      userId,
      itemId,
      status: SubscriptionStatus.ACTIVE
    });
    
    if (existingSubscription) {
      throw new BadRequestException(`User already has an active subscription to this item`);
    }
    
    // Handle payment if this is a paid item
    let paymentId = null;
    
    if (item.pricingModel !== PricingModel.FREE && item.price > 0) {
      if (!paymentDetails) {
        throw new BadRequestException(`Payment details required for paid subscription`);
      }
      
      // Process payment
      const paymentResult = await this.paymentService.processPayment({
        userId,
        amount: item.price,
        currency: item.currency || 'USD',
        description: `Subscription to ${item.name}`,
        metadata: {
          itemId,
          itemType: item.type
        },
        ...paymentDetails
      });
      
      paymentId = paymentResult.id;
    }
    
    // Create the subscription
    const subscription = await this.userSubscriptionRepository.create({
      userId,
      itemId,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      endDate: this.calculateSubscriptionEndDate(item),
      paymentId,
      pricePaid: item.price,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    this.logger.log(`Created subscription for user ${userId} to item ${itemId}`);
    
    return subscription;
  }

  /**
   * Cancel a user's subscription to a marketplace item
   */
  async cancelSubscription(userId: string, subscriptionId: string): Promise<UserSubscription> {
    const subscription = await this.userSubscriptionRepository.findById(subscriptionId);
    
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
    }
    
    if (subscription.userId !== userId) {
      throw new BadRequestException(`Subscription does not belong to the specified user`);
    }
    
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(`Subscription is not active`);
    }
    
    // Update the subscription
    const updatedSubscription = await this.userSubscriptionRepository.update(subscriptionId, {
      status: SubscriptionStatus.CANCELLED,
      cancelledDate: new Date(),
      updatedAt: new Date()
    });
    
    this.logger.log(`Cancelled subscription ${subscriptionId} for user ${userId}`);
    
    return updatedSubscription;
  }

  /**
   * Get a user's subscriptions
   */
  async getUserSubscriptions(userId: string, status?: SubscriptionStatus): Promise<UserSubscription[]> {
    const filter: any = { userId };
    
    if (status) {
      filter.status = status;
    }
    
    return await this.userSubscriptionRepository.find(filter, {
      sort: { createdAt: 'DESC' }
    });
  }

  /**
   * Check if a user has access to a marketplace item
   */
  async checkUserAccess(userId: string, itemId: string): Promise<{ hasAccess: boolean; subscription?: UserSubscription }> {
    // Get the item
    const item = await this.getItemById(itemId);
    
    // If the item is free, grant access
    if (item.pricingModel === PricingModel.FREE) {
      return { hasAccess: true };
    }
    
    // Check for an active subscription
    const subscription = await this.userSubscriptionRepository.findOne({
      userId,
      itemId,
      status: SubscriptionStatus.ACTIVE
    });
    
    // If subscription exists and is not expired, grant access
    if (subscription && (!subscription.endDate || subscription.endDate > new Date())) {
      return { hasAccess: true, subscription };
    }
    
    return { hasAccess: false };
  }

  /**
   * Calculate the end date for a subscription based on the pricing model
   */
  private calculateSubscriptionEndDate(item: MarketplaceItem): Date | null {
    if (item.pricingModel === PricingModel.FREE || item.pricingModel === PricingModel.ONE_TIME) {
      // Free or one-time purchases don't expire
      return null;
    }
    
    const now = new Date();
    
    switch (item.pricingModel) {
      case PricingModel.MONTHLY:
        return new Date(now.setMonth(now.getMonth() + 1));
      case PricingModel.YEARLY:
        return new Date(now.setFullYear(now.getFullYear() + 1));
      default:
        return null;
    }
  }

  /**
   * Get available subscription tiers
   */
  async getSubscriptionTiers(): Promise<any[]> {
    // These would typically come from a database, but for now we'll return hardcoded tiers
    return [
      {
        id: 'free',
        name: 'Free',
        description: 'Basic access with limited features',
        price: 0,
        currency: 'USD',
        features: [
          'Access to basic integrations',
          'Limited workflow executions',
          'Community support'
        ]
      },
      {
        id: 'pro',
        name: 'Professional',
        description: 'Advanced features for professionals',
        price: 19.99,
        currency: 'USD',
        features: [
          'Access to all standard integrations',
          'Unlimited workflow executions',
          'Priority support',
          'Advanced analytics'
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Full-featured solution for organizations',
        price: 99.99,
        currency: 'USD',
        features: [
          'Access to all integrations including premium',
          'Unlimited everything',
          'Dedicated support',
          'Custom integrations',
          'Team collaboration features',
          'Advanced security features'
        ]
      }
    ];
  }
}