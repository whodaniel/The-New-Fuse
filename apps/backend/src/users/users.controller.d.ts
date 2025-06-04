import { UsersService } from './users.service.js';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto.js';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<any>;
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<any>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<any>;
    delete(id: string): Promise<void>;
}
