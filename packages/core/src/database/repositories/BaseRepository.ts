import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial } from 'typeorm';

export class BaseRepository<T> extends Repository<T> {
  async findById(id: string): Promise<T | null> {
    return this.findOne({ where: { id } as FindOptionsWhere<T> });
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.find(options);
  }

  async createEntity(data: DeepPartial<T>): Promise<T> {
    const entity = this.create(data);
    return this.save(entity);
  }

  async updateEntity(id: string, data: DeepPartial<T>): Promise<T | null> {
    await this.update({ id } as any, data);
    return this.findById(id);
  }

  async deleteEntity(id: string): Promise<boolean> {
    const result = await this.delete({ id } as any);
    return (result.affected ?? 0) > 0;
  }

  async paginate(page: number = 1, limit: number = 10, options?: FindManyOptions<T>) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.findAndCount({
      ...options,
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
