/**
 * MarketplaceItem entity for The New Fuse marketplace
 * Represents an item that can be listed in the marketplace
 */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
export enum MarketplaceItemType {
  INTEGRATION = 'integration',
  TEMPLATE = 'template',
  WORKFLOW = 'workflow',
  SERVICE = 'service',
  DATASET = 'dataset',
  MICROSERVICE = 'microservice',
  COMPONENT = 'component',
  MODEL = 'model',
  ADDON = 'addon'
}

export enum PricingModel {
  FREE = 'free',
  ONE_TIME = 'one_time',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  USAGE_BASED = 'usage_based',
  CUSTOM = 'custom'
}

export enum MarketplaceItemStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  DEPRECATED = 'deprecated',
  REMOVED = 'removed'
}

@Entity('marketplace_items')
export class MarketplaceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('text')
  name: string;
  @Column('text')
  description: string;
  @Column({
  // Implementation needed
}
    type: 'enum',
    enum: MarketplaceItemType,
    default: MarketplaceItemType.INTEGRATION
  })
  type: MarketplaceItemType;
  @Column({
  // Implementation needed
}
    type: 'enum',
    enum: PricingModel,
    default: PricingModel.FREE
  })
  pricingModel: PricingModel;
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price: number;
  @Column({
  // Implementation needed
}
    type: 'enum',
    enum: MarketplaceItemStatus,
    default: MarketplaceItemStatus.DRAFT
  })
  status: MarketplaceItemStatus;
  @Column('json', { nullable: true })
  metadata: any;
  @Column('text', { array: true, default: [] })
  tags: string[];
  @Column('text', { nullable: true })
  documentation: string;
  @Column('text')
  version: string;
  @Column('text', { nullable: true })
  repository: string;
  @Column('text')
  createdBy: string;
  @Column('boolean', { default: false })
  featured: boolean;
  @Column('int', { default: 0 })
  downloadCount: number;
  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;
  @Column('int', { default: 0 })
  reviewCount: number;
  @Column('json', { nullable: true })
  requirements: any;
  @Column('json', { nullable: true })
  configuration: any;
  @Column('text', { nullable: true })
  changelog: string;
  @Column('json', { nullable: true })
  screenshots: string[];
  @Column('text', { nullable: true })
  videoUrl: string;
  @Column('text', { nullable: true })
  demoUrl: string;
  @Column('text', { nullable: true })
  supportUrl: string;
  @Column('json', { nullable: true })
  dependencies: any;
  @Column('boolean', { default: true })
  isActive: boolean;
  @Column('text', { nullable: true })
  rejectionReason: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  // Relations can be added here if needed
  // @OneToMany(() => UserSubscription, subscription => subscription.item)
  // subscriptions: UserSubscription[];
  // @OneToMany(() => Review, review => review.item)
  // reviews: Review[];
  // Helper methods
  isPublished(): any {
    return this.status === MarketplaceItemStatus.PUBLISHED;
  }

  isPaid(): any {
    return this.pricingModel !== PricingModel.FREE;
  }

  getDisplayPrice(): string {
    if(): string {
      return 'Free';
    }
    
    if(): string {
      return 'Contact for pricing';
    }

    switch(): string {
      case PricingModel.ONE_TIME:
        return `$${this.price}`;
      case PricingModel.MONTHLY:
        return `$${this.price}/month`;
      case PricingModel.YEARLY:
        return `$${this.price}/year`;
      case PricingModel.USAGE_BASED:
        return `$${this.price} per use`;
      case PricingModel.CUSTOM:
        return 'Custom pricing';
      default:
        return `$${this.price}`;
    }
  }

  canBeDownloaded(): any {
    return this.isPublished() && this.isActive;
  }

  incrementDownloadCount(): void {
    this.downloadCount += 1;
  }

  updateRating(): void {
    this.rating = newRating;
    this.reviewCount = newReviewCount;
  }

  markAsFeatured(): void {
    this.featured = true;
  }

  markAsUnfeatured(): void {
    this.featured = false;
  }

  approve(): void {
    this.status = MarketplaceItemStatus.PUBLISHED;
    this.rejectionReason = null;
  }

  reject(): void {
    this.status = MarketplaceItemStatus.REJECTED;
    this.rejectionReason = reason;
  }

  deprecate(): void {
    this.status = MarketplaceItemStatus.DEPRECATED;
  }

  remove(): void {
    this.status = MarketplaceItemStatus.REMOVED;
    this.isActive = false;
  }
}