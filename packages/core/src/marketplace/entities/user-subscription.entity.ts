/**
 * UserSubscription entity for The New Fuse marketplace
 * Represents a user's subscription to a marketplace item
 */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity.js';
import { MarketplaceItem } from './marketplace-item.entity.js';

/**
 * Status of a user subscription
 */
export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended'
}

@Entity('user_subscriptions')
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  itemId: string;

  @ManyToOne(() => MarketplaceItem)
  @JoinColumn({ name: 'itemId' })
  item: MarketplaceItem;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING
  })
  status: SubscriptionStatus;

  @Column()
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  cancelledDate: Date;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  pricePaid: number;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ nullable: true })
  renewalPaymentId: string;

  @Column({ default: false })
  autoRenew: boolean;

  @Column('json', { nullable: true })
  usage: Record<string, any>;

  @Column('json', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}