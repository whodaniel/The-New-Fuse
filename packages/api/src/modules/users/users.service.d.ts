import { LoggingService } from '../../services/logging.service';
import { EventBus } from '../events/event-bus.service';
export interface User {
    id: string;
    email: string;
    name?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateUserDto {
    email: string;
    password: string;
    name?: string;
}
export declare class UsersService {
    private readonly logger;
    private readonly eventBus;
    private users;
    constructor(logger: LoggingService, eventBus: EventBus);
    createUser(createUserDto: CreateUserDto): Promise<User>;
}
//# sourceMappingURL=users.service.d.ts.map