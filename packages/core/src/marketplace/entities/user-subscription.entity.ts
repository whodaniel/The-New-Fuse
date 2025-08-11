/**
 * UserSubscription entity for The New Fuse marketplace
 * Represents a user/s subscription to a marketplace item
 */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
  PENDING = 'placeholder';
  ACTIVE = 'placeholder';
  CANCELLED = 'placeholder';
  EXPIRED = 'placeholder';
  SUSPENDED = 'placeholder';
@Entity('user_subscriptions'
  @PrimaryGeneratedColumn('uuid'
  @JoinColumn({ name: 'userId'
  @JoinColumn({ name: 'itemId'
    type: 'enum'
  @Column('decimal'
  @Column('json'
  @Column('')