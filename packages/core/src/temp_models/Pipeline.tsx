import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Agent } from './Agent.js'; // Assuming Agent entity import
// import { Stage } from './Stage.js'; // If you have a Stage entity

@Entity()
export class Pipeline {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column({ nullable: true })
    description?: string;

    // Example ManyToMany relationship with Agent
    @ManyToMany(() => Agent)
    @JoinTable() // This will create a join table pipeline_agents_agent
    agents!: Agent[];

    // If Pipelines have stages, you might define them like this:
    // @Column('jsonb', { nullable: true })
    // stages?: Stage[]; // Assuming Stage is a defined interface/type

    @Column({ default: 'active' })
    status!: 'active' | 'inactive' | 'archived';

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // Example method
    // async run(params?: any): Promise<void> {
    //    console.log(\`Running pipeline ${this.name} with agents:\`, this.agents);
    //    // Add execution logic here
    // }
}
