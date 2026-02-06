import { Injectable } from "@nestjs/common";
import { DatabaseService } from '../database.service.tsx';
import { User, Drizzle } from "@the-new-fuse/database";

@Injectable()
export class UserRepository {
  constructor(private db: DatabaseService) {}

  async findById(id: string): Promise<User | null> {
    return this.db.client.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.client.user.findUnique({
      where: { email },
    });
  }

  async create(data: Drizzle.UserCreateInput): Promise<User> {
    return this.db.client.user.create({
      data,
    });
  }

  async update(id: string, data: Drizzle.UserUpdateInput): Promise<User> {
    return this.db.client.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return this.db.client.user.delete({
      where: { id },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Drizzle.UserWhereInput;
    orderBy?: Drizzle.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    return this.db.client.user.findMany(params);
  }
}
