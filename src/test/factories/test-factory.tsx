import { container } from '../setup.js';
import type { TYPES } from '../../core/di/types.js';
import { DatabaseService } from '../../core/database/database-service.js';
import { faker } from "@faker-js/faker";
import { DeepPartial } from "typeorm";
import { User } from '../../entities/user.entity.js';
import { Workflow } from '../../entities/workflow.entity.js';

export class TestFactory {
  protected static dbService = container.get<DatabaseService>(
    TYPES.DatabaseService,
  );

  protected static async createEntity<T>(
    entityClass: new () => T,
    data: DeepPartial<T>,
  ): Promise<T> {
    const connection = await this.dbService.getConnection();
    const repository = connection.getRepository(entityClass);
    const entity = repository.create(data);
    return repository.save(entity as any);
  }

  protected static generateFakeData<T>(template: Record<string, any>): T {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(template)) {
      if(typeof value === "function") {
        result[key] = value();
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }
}

export class UserFactory extends TestFactory {
  static async create(overrides: Partial<User> = {}): Promise<User> {
    const defaultData = this.generateFakeData<User>({
      email: () => faker.internet.email(),
      firstName: () => faker.person.firstName(),
      lastName: () => faker.person.lastName(),
      password: () => faker.internet.password(),
      roles: ["user"],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.createEntity(User, { ...defaultData, ...overrides });
  }

  static async createMany(
    count: number,
    overrides: Partial<User> = {},
  ): Promise<User[]> {
    return Promise.all(
      Array.from({ length: count }, () =>
        this.create(overrides),
      ),
    );
  }
}

export class WorkflowFactory extends TestFactory {
  static async create(overrides: Partial<Workflow> = {}): Promise<Workflow> {
    const defaultData = this.generateFakeData<Workflow>({
      name: () => faker.company.name(),
      description: () => faker.lorem.paragraph(),
      status: "active",
      createdBy: () => faker.string.uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.createEntity(Workflow, {
      ...defaultData,
      ...overrides,
    });
  }

  static async createMany(
    count: number,
    overrides: Partial<Workflow> = {},
  ): Promise<Workflow[]> {
    return Promise.all(
      Array.from({ length: count }, () =>
        this.create(overrides),
      ),
    );
  }
}

// Add more factories as needed for other entities
