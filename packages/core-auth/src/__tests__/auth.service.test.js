"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth.service");
const database_1 = require("@the-new-fuse/database");
const bcrypt = __importStar(require("bcrypt"));
// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt;
describe('AuthService', () => {
    let service;
    let prismaService;
    let jwtService;
    let configService;
    const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        hashedPassword: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: database_1.PrismaService,
                    useValue: {
                        user: {
                            findUnique: jest.fn(),
                            create: jest.fn(),
                        },
                    },
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: {
                        sign: jest.fn(),
                        verifyAsync: jest.fn(),
                    },
                },
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        prismaService = module.get(database_1.PrismaService);
        jwtService = module.get(jwt_1.JwtService);
        configService = module.get(config_1.ConfigService);
        // Setup default mocks
        configService.get.mockImplementation((key) => {
            const config = {
                JWT_SECRET: 'test-secret',
                JWT_EXPIRES_IN: '15m',
                JWT_REFRESH_SECRET: 'refresh-secret',
                JWT_REFRESH_EXPIRES_IN: '7d',
            };
            return config[key];
        });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('register', () => {
        it('should successfully register a new user', async () => {
            const registerDto = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            };
            prismaService.user.findUnique.mockResolvedValue(null);
            mockedBcrypt.hash.mockResolvedValue('hashedPassword123');
            prismaService.user.create.mockResolvedValue(mockUser);
            jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
            const result = await service.register(registerDto);
            expect(result).toEqual({
                access_token: 'access-token',
                refresh_token: 'refresh-token',
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    name: mockUser.name,
                },
            });
            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email: registerDto.email },
            });
            expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
            expect(prismaService.user.create).toHaveBeenCalledWith({
                data: {
                    email: registerDto.email,
                    hashedPassword: 'hashedPassword123',
                    name: registerDto.name,
                },
            });
        });
        it('should throw ConflictException if user already exists', async () => {
            const registerDto = {
                email: 'test@example.com',
                password: 'password123',
            };
            prismaService.user.findUnique.mockResolvedValue(mockUser);
            await expect(service.register(registerDto)).rejects.toThrow(common_1.ConflictException);
            expect(prismaService.user.create).not.toHaveBeenCalled();
        });
    });
    describe('login', () => {
        it('should successfully login with valid credentials', async () => {
            const loginDto = {
                email: 'test@example.com',
                password: 'password123',
            };
            prismaService.user.findUnique.mockResolvedValue(mockUser);
            mockedBcrypt.compare.mockResolvedValue(true);
            jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
            const result = await service.login(loginDto);
            expect(result).toEqual({
                access_token: 'access-token',
                refresh_token: 'refresh-token',
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    name: mockUser.name,
                },
            });
            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email: loginDto.email },
            });
            expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.hashedPassword);
        });
        it('should throw UnauthorizedException for invalid email', async () => {
            const loginDto = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };
            prismaService.user.findUnique.mockResolvedValue(null);
            await expect(service.login(loginDto)).rejects.toThrow(common_1.UnauthorizedException);
            expect(mockedBcrypt.compare).not.toHaveBeenCalled();
        });
        it('should throw UnauthorizedException for invalid password', async () => {
            const loginDto = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };
            prismaService.user.findUnique.mockResolvedValue(mockUser);
            mockedBcrypt.compare.mockResolvedValue(false);
            await expect(service.login(loginDto)).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
    describe('refreshToken', () => {
        it('should successfully refresh token with valid refresh token', async () => {
            const refreshTokenDto = { refreshToken: 'valid-refresh-token' };
            const payload = { sub: mockUser.id, email: mockUser.email };
            jwtService.verifyAsync.mockResolvedValue(payload);
            prismaService.user.findUnique.mockResolvedValue(mockUser);
            jwtService.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');
            const result = await service.refreshToken(refreshTokenDto);
            expect(result).toEqual({
                access_token: 'new-access-token',
                refresh_token: 'new-refresh-token',
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    name: mockUser.name,
                },
            });
            expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshTokenDto.refreshToken, {
                secret: 'refresh-secret',
            });
        });
        it('should throw UnauthorizedException for invalid refresh token', async () => {
            const refreshTokenDto = { refreshToken: 'invalid-refresh-token' };
            jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));
            await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should throw UnauthorizedException if user not found', async () => {
            const refreshTokenDto = { refreshToken: 'valid-refresh-token' };
            const payload = { sub: 'nonexistent-user-id', email: 'test@example.com' };
            jwtService.verifyAsync.mockResolvedValue(payload);
            prismaService.user.findUnique.mockResolvedValue(null);
            await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
    describe('validateUser', () => {
        it('should return user if found', async () => {
            prismaService.user.findUnique.mockResolvedValue(mockUser);
            const result = await service.validateUser(mockUser.id);
            expect(result).toEqual(mockUser);
            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { id: mockUser.id },
            });
        });
        it('should return null if user not found', async () => {
            prismaService.user.findUnique.mockResolvedValue(null);
            const result = await service.validateUser('nonexistent-id');
            expect(result).toBeNull();
        });
        it('should return null on database error', async () => {
            prismaService.user.findUnique.mockRejectedValue(new Error('Database error'));
            const result = await service.validateUser(mockUser.id);
            expect(result).toBeNull();
        });
    });
    describe('utility methods', () => {
        it('should hash password correctly', async () => {
            const password = 'testpassword';
            const hashedPassword = 'hashedTestPassword';
            mockedBcrypt.hash.mockResolvedValue(hashedPassword);
            const result = await service.hashPassword(password);
            expect(result).toBe(hashedPassword);
            expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
        });
        it('should compare password correctly', async () => {
            const password = 'testpassword';
            const hashedPassword = 'hashedTestPassword';
            mockedBcrypt.compare.mockResolvedValue(true);
            const result = await service.comparePassword(password, hashedPassword);
            expect(result).toBe(true);
            expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        });
    });
});
//# sourceMappingURL=auth.service.test.js.map