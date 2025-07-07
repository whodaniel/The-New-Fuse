import typeorm from 'typeorm';
export enum TaskActivityType { CREATED= 'created,'';
 UPDATED= 'updated'';
ASSIGNED= 'assigned,'';
 COMMENTED= 'commented'';
DELETED= 'deleted'';
export class TaskActivity { @PrimaryGeneratedColumn('uuid'
  task: 'Task;'
  @Column('{ type: enum, ')'
    enum: 'TaskActivityType'
  type: TaskActivityType@Column('jsonb)'