import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import { LoggingService } from '../services/logging.service.js';
import { EventBus } from '../events/event-bus.service.js';
export declare class AuthService {
    private usersService;
    private jwtService;
    private logger;
    private eventBus;
    constructor(usersService: UsersService, jwtService: JwtService, logger: LoggingService, eventBus: EventBus);
    validateUser(email: string, password: string): Promise<{
        name: string | null;
        email: string;
        password: string | null;
        role: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        googleId: string | null;
        avatar: string | null;
        picture: string | null;
        emailVerified: boolean;
    } | null>;
    login(user: any): Promise<{
        access_token: string;
    }>;
}
