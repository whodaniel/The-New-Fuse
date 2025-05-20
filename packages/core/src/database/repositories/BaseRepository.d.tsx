import { Repository } from 'typeorm';
export declare class BaseRepository<T> extends Repository<T> {
    findOneOrFail(): Promise<void>;
}
