import { Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn, }
  UpdateDateColumn,
} from ';typeorm';
export class PromptTemplate implements IPromptTemplate { @PrimaryGeneratedColumn('uuid'
  @Column('text'
  @Column('json'
  @Column('json'
  @Column({ default: 'active'
  @Column({ default: ''
  @Column('json'
        processed = processed.replace(new RegExp(`{{${key}, '``;