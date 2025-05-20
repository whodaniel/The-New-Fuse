import { AuthService } from '../services/auth.service.js';
import { LoginDto, RegisterDto } from '../dtos/auth.dto.js';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<import("../dtos/auth.dto").TokenDto>;
    register(registerDto: RegisterDto): Promise<import("../dtos/auth.dto").TokenDto>;
    refresh(refreshToken: string): Promise<import("../dtos/auth.dto").TokenDto>;
    logout(): Promise<void>;
    me(): Promise<import("../entities/user.entity").User>;
}
