import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pipeline } from './Pipeline';
import { User } from './User';

@Entity()
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  type!: string;

  @Column({ type: 'jsonb', nullable: true })
  config!: Record<string, any>;

  @ManyToOne(() => User, (user) => user.agents)
  user!: User;

  @Column()
  userId!: string;

  @OneToMany(() => Pipeline, (pipeline) => pipeline.agent)
  pipelines!: Pipeline[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
