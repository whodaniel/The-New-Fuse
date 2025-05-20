import { DeepPartial } from "typeorm";
import { User } from '../../entities/user.entity.js';
import { Workflow } from '../../entities/workflow.entity.js';

export declare class TestFactory {
    protected static dbService: unknown;
    protected static createEntity<T>(entityClass: new () => T, data: DeepPartial<T>): Promise<T>;
    protected static generateFakeData<T>(template: Record<string, any>): T;
}

export declare class UserFactory extends TestFactory {
    static create(overrides?: Partial<User>): Promise<User>;
    static createMany(count: number, overrides?: Partial<User>): Promise<User[]>;
}

export declare class WorkflowFactory extends TestFactory {
    static create(overrides?: Partial<Workflow>): Promise<Workflow>;
    static createMany(count: number, overrides?: Partial<Workflow>): Promise<Workflow[]>;
}
