import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface IPromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: Record<string, any>;
  metadata?: Record<string, any>;
  status?: string;
  version?: string;
}

@Entity('prompt_templates')
export class PromptTemplate implements IPromptTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column('text')
  template!: string;

  @Column('jsonb')
  variables!: Record<string, any>;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column({ default: 'active' })
  status?: string;

  @Column({ default: '1.0' })
  version?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  process(values: Record<string, any>): string {
    let processed = this.template;
    Object.entries(values).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });
    return processed;
  }
}
