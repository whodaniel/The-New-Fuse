import { BaseRepository } from './BaseRepository.js';
import { User } from '../entities/User.js';
export declare class UserRepository extends BaseRepository<User> {
    findByEmail(): Promise<void>;
}
