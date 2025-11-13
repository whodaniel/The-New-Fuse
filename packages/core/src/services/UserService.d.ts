import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoggingService } from './LoggingService';
import { MetricsService } from './MetricsService';
import { SafeUser, UserProfile, UserPreferences } from '../types/user.types';
export interface CreateUserDto {
    username: string;
    email: string;
    password: string;
    role?: 'admin' | 'user' | 'guest';
    profile?: Partial<UserProfile>;
    preferences?: Partial<UserPreferences>;
}
export interface UpdateUserDto {
    username?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'user' | 'guest';
    isActive?: boolean;
    profile?: Partial<UserProfile>;
    preferences?: Partial<UserPreferences>;
}
export interface UserFilter {
    role?: 'admin' | 'user' | 'guest';
    isActive?: boolean;
    search?: string;
    createdAfter?: Date;
    createdBefore?: Date;
}
export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    usersByRole: Record<string, number>;
}
export declare class UserService {
    private readonly loggingService;
    private readonly metricsService;
    private readonly eventEmitter;
    private users;
    private usernameIndex;
    private emailIndex;
    constructor(loggingService: LoggingService, metricsService: MetricsService, eventEmitter: EventEmitter2);
    private initializeDefaultUsers;
    createUser(createUserDto: CreateUserDto): Promise<SafeUser>;
    updateUser(id: string, updateUserDto: UpdateUserDto): Promise<SafeUser>;
}
//# sourceMappingURL=UserService.d.ts.map