/**
 * MarketplaceItem entity for The New Fuse marketplace
 * Represents an item that can be listed in the marketplace
 */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../user/entities/user.entity.js';
import { UserSubscription } from './user-subscription.entity.js';

/**
 * Types of marketplace items
 */
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

/**
 * Pricing models for marketplace items
 */
export enum PricingModel {
  FREE = 'free',
  ONE_TIME = 'one_time',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  USAGE_BASED = 'usage_based',
  CUSTOM = 'custom'
}

/**
 * Status of a marketplace item
 */
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

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: MarketplaceItemType,
    default: MarketplaceItemType.INTEGRATION
  })
  type: MarketplaceItemType;

  @Column({
    type: 'enum',
    enum: MarketplaceItemStatus,
    default: MarketplaceItemStatus.DRAFT
  })
  status: MarketplaceItemStatus;

  @Column({ nullable: true })
  integrationId: string;

  @Column({ nullable: true })
  workflowId: string;

  @Column('text', { nullable: true })
  imageUrl: string;

  @Column({ default: false })
  featured: boolean;

  @Column({ default: 0 })
  popularityScore: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PricingModel,
    default: PricingModel.FREE
  })
  pricingModel: PricingModel;

  @Column('json', { nullable: true })
  pricingDetails: any;

  @Column('text', { nullable: true })
  termsAndConditionsUrl: string;

  @Column('text', { nullable: true })
  privacyPolicyUrl: string;

  @Column('text', { nullable: true })
  supportUrl: string;

  @Column('text', { nullable: true })
  documentationUrl: string;

  @Column('simple-array', { nullable: true })
  categories: string[];

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ default: 0 })
  installCount: number;

  @Column({ default: 0 })
  viewCount: number;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ nullable: true })
  creatorId: string;

  @ManyToOne(() => User)
  creator: User;

  @OneToMany(() => UserSubscription, subscription => subscription.item)
  subscriptions: UserSubscription[];

  @Column('json', { nullable: true })
  metadata: Record<string, any>;

  @Column('json', { nullable: true })
  requirements: Record<string, any>;

  @Column('json', { nullable: true })
  capabilities: Record<string, any>;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}