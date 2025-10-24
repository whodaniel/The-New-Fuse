import typeorm from 'typeorm';
 TODO= 'TODO'';
IN_REVIEW= 'IN_REVIEW,'';
 COMPLETED= 'COMPLETED'';
  CANCELLED = 'CANCELLED'';
export enum TaskPriority { LOW= 'LOW,'';
 MEDIUM= 'MEDIUM'';
URGENT= 'URGENT'';
export class Task { @PrimaryGeneratedColumn('uuid'): string'
  title: 'string;'
  @Column('{type: enum, ')'
    default: ''
  @Column('{ '
  type: 'enum,'
    default: 'TaskPriority.MEDIUM;'
  tags: string[];@Column('{ type:timestamp, nullable: true })!'
 updatedAt: Date;@Column('uuid, { nullable: true })'