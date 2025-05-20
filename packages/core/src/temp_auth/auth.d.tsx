import { Repository } from 'typeorm';
import { User } from '../models/User.js';
export declare class AuthManagerImpl {
    private readonly userRepository;
    private readonly secretKey;
    private readonly tokenExpireMinutes;
    constructor(userRepository: Repository<User>, secretKey: string, tokenExpireMinutes?: number);
    registerUser(): Promise<void>;
}
