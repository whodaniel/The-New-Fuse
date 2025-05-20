import { Repository, FindOneOptions, FindManyOptions, DeepPartial } from 'typeorm';

export class BaseRepository<T> extends Repository<T> {
    async findOneOrFail(options: FindOneOptions<T>): Promise<T> {
        const result = await this.findOne(options);
        if (!result) {
            throw new Error('Entity not found');
        }
        return result;
    }

    async updateById(id: string, data: DeepPartial<T>): Promise<T> {
        await this.update(id, data);
        return this.findOneOrFail({ where: { id } as any });
    }

    async softDeleteById(id: string): Promise<boolean> {
        const result = await this.softDelete(id);
        return result.affected > 0;
    }

    async exists(options: FindOneOptions<T>): Promise<boolean> {
        const count = await this.count(options);
        return count > 0;
    }

    async paginate(
        options: FindManyOptions<T> & { page?: number; limit?: number }
    ): Promise<{ items: T[]; total: number; page: number; pageCount: number }> {
        const page = options.page || 1;
        const limit = options.limit || 10;
        const skip = (page - 1) * limit;

        const [items, total] = await this.findAndCount({
            ...options,
            skip,
            take: limit,
        });

        return {
            items,
            total,
            page,
            pageCount: Math.ceil(total / limit),
        };
    }
}
