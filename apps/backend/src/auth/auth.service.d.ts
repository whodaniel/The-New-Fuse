import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoggingService } from '../services/logging.service';
import { EventBus } from '../events/event-bus.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private logger;
    private eventBus;
    constructor(usersService: UsersService, jwtService: JwtService, logger: LoggingService, eventBus: EventBus);
    validateUser(email: string, password: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
        };
    }>;
    register(email: string, password: string, name: string): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
        };
    }>;
    authenticate(firebaseToken: string): Promise<{
        message: string;
    }>;
    logout(token: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map