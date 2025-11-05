import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto } from '../dtos/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<any>;
    register(registerDto: RegisterDto): Promise<any>;
    refresh(refreshToken: string): Promise<any>;
    logout(): Promise<any>;
    me(): Promise<any>;
}
//# sourceMappingURL=auth.controller.d.ts.map