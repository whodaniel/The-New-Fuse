import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity.js';
import { LoginDto, RegisterDto, TokenDto } from '../dtos/auth.dto.js';
import { ConfigService } from '@nestjs/config';
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtService;
    private readonly configService;
    constructor(userRepository: Repository<User>, jwtService: JwtService, configService: ConfigService);
    validateToken(token: string): Promise<User>;
    login(loginDto: LoginDto): Promise<TokenDto>;
    register(registerDto: RegisterDto): Promise<TokenDto>;
    refresh(refreshToken: string): Promise<TokenDto>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<User>;
    private generateTokens;
}
