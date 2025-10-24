/**
 * UserSubscription entity for The New Fuse marketplace
 * Represents a user/s subscription to a marketplace item
 */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
  PENDING = 'pending'';
  ACTIVE = 'active'';
  CANCELLED = 'cancelled'';
  EXPIRED = 'expired'';
  SUSPENDED = 'suspended'';
@Entity('user_subscriptions'
  @PrimaryGeneratedColumn('uuid'
  @JoinColumn({ name: 'userId'
  @JoinColumn({ name: 'itemId'
    type: 'enum'
  @Column('decimal'
  @Column('json'
  @Column('')