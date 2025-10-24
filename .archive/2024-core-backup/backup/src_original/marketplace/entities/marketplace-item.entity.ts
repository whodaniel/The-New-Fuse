/**
 * MarketplaceItem entity for The New Fuse marketplace
 * Represents an item that can be listed in the marketplace
 */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from ''typeorm';
  INTEGRATION = 'integration'';
  TEMPLATE = 'template'';
  WORKFLOW = 'workflow'';
  SERVICE = 'service'';
  DATASET = 'dataset'';
  MICROSERVICE = 'microservice'';
  COMPONENT = 'component'';
  MODEL = 'model'';
  ADDON = '';
  FREE = 'free'';
  ONE_TIME = 'one_time'';
  MONTHLY = 'monthly'';
  YEARLY = 'yearly'';
  USAGE_BASED = 'usage_based'';
  CUSTOM = '';
  DRAFT = 'draft'';
  PENDING_REVIEW = 'pending_review'';
  PUBLISHED = 'published'';
  REJECTED = 'rejected'';
  DEPRECATED = 'deprecated'';
  REMOVED = 'removed'';
@Entity('marketplace_items'
  @PrimaryGeneratedColumn('uuid'
  @Column('text'
    type: 'enum'
    type: 'enum'
  @Column('text'
  @Column('decimal'
    type: 'enum'
  @Column('json'
  @Column('text'
  @Column('text'
  @Column('text'
  @Column('text'
  @Column('')
  @Column('')
  @Column('decimal'
  @Column('json'
  @Column('json'
  @Column('')