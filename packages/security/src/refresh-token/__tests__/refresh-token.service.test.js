"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const refresh_token_service_1 = require("../refresh-token.service");
const database_1 = require("@the-new-fuse/database");
const core_1 = require("@the-new-fuse/core");
const date_fns_1 = require("date-fns");
describe('RefreshTokenService', () => {
    let service;
    let prismaService;
    let encryptionService;
    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
    };
    const mockRefreshTokenRecord = {
        id: 'token-123',
        userId: mockUser.id,
        token: 'encrypted-token',
        expiresAt: (0, date_fns_1.addDays)(new Date(), 30),
        createdAt: new Date(),
        updatedAt: new Date(),
        isRevoked: false,
        deviceInfo: 'iPhone 14',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        user: mockUser,
    };
    beforeEach(async () => {
        const mockPrismaService = {
            refreshToken: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                updateMany: jest.fn(),
                deleteMany: jest.fn(),
                count: jest.fn(),
            },
        };
        const mockEncryptionService = {
            encrypt: jest.fn(),
            decrypt: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                refresh_token_service_1.RefreshTokenService,
                {
                    provide: database_1.PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: core_1.EncryptionService,
                    useValue: mockEncryptionService,
                },
            ],
        }).compile();
        service = module.get(refresh_token_service_1.RefreshTokenService);
        prismaService = module.get(database_1.PrismaService);
        encryptionService = module.get(core_1.EncryptionService);
        // Reset all mocks before each test
        jest.clearAllMocks();
    });
    describe('generateRefreshToken', () => {
        it('should generate a new refresh token successfully', async () => {
            const payload = {
                userId: mockUser.id,
                deviceInfo: 'iPhone 14',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
            };
            const encryptedToken = 'encrypted-token-data';
            encryptionService.encrypt.mockResolvedValue(encryptedToken);
            prismaService.refreshToken.create.mockResolvedValue(mockRefreshTokenRecord);
            prismaService.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
            prismaService.refreshToken.findMany.mockResolvedValue([]);
            const result = await service.generateRefreshToken(payload);
            expect(result).toBe(encryptedToken);
            expect(encryptionService.encrypt).toHaveBeenCalledWith(expect.stringContaining(mockUser.id), expect.any(String));
            expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: mockUser.id,
                    token: encryptedToken,
                    deviceInfo: payload.deviceInfo,
                    ipAddress: payload.ipAddress,
                    userAgent: payload.userAgent,
                }),
            });
        });
        it('should clean up old tokens after generating new one', async () => {
            const payload = { userId: mockUser.id };
            encryptionService.encrypt.mockResolvedValue('encrypted-token');
            prismaService.refreshToken.create.mockResolvedValue(mockRefreshTokenRecord);
            prismaService.refreshToken.deleteMany.mockResolvedValue({ count: 2 });
            prismaService.refreshToken.findMany.mockResolvedValue([]);
            await service.generateRefreshToken(payload);
            expect(prismaService.refreshToken.deleteMany).toHaveBeenCalled();
        });
    });
    describe('validateRefreshToken', () => {
        it('should validate a valid refresh token successfully', async () => {
            const tokenData = {
                userId: mockUser.id,
                timestamp: Date.now(),
                random: 'random-string',
            };
            prismaService.refreshToken.findUnique.mockResolvedValue(mockRefreshTokenRecord);
            encryptionService.decrypt.mockResolvedValue(JSON.stringify(tokenData));
            const result = await service.validateRefreshToken('valid-token');
            expect(result).toEqual({
                userId: mockUser.id,
                deviceInfo: mockRefreshTokenRecord.deviceInfo,
                ipAddress: mockRefreshTokenRecord.ipAddress,
                userAgent: mockRefreshTokenRecord.userAgent,
            });
        });
        it('should throw UnauthorizedException for non-existent token', async () => {
            prismaService.refreshToken.findUnique.mockResolvedValue(null);
            await expect(service.validateRefreshToken('invalid-token')).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should throw UnauthorizedException for revoked token', async () => {
            const revokedToken = { ...mockRefreshTokenRecord, isRevoked: true };
            prismaService.refreshToken.findUnique.mockResolvedValue(revokedToken);
            await expect(service.validateRefreshToken('revoked-token')).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should throw UnauthorizedException for expired token', async () => {
            const expiredToken = {
                ...mockRefreshTokenRecord,
                expiresAt: (0, date_fns_1.subDays)(new Date(), 1), // Expired yesterday
            };
            prismaService.refreshToken.findUnique.mockResolvedValue(expiredToken);
            prismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });
            await expect(service.validateRefreshToken('expired-token')).rejects.toThrow(common_1.UnauthorizedException);
            expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
                where: { token: 'expired-token' },
                data: { isRevoked: true },
            });
        });
        it('should throw UnauthorizedException for inactive user', async () => {
            const inactiveUserToken = {
                ...mockRefreshTokenRecord,
                user: { ...mockUser, isActive: false },
            };
            prismaService.refreshToken.findUnique.mockResolvedValue(inactiveUserToken);
            encryptionService.decrypt.mockResolvedValue(JSON.stringify({
                userId: mockUser.id,
                timestamp: Date.now(),
                random: 'random',
            }));
            await expect(service.validateRefreshToken('inactive-user-token')).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
    describe('revokeRefreshToken', () => {
        it('should revoke a refresh token successfully', async () => {
            prismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });
            await service.revokeRefreshToken('token-to-revoke');
            expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
                where: { token: 'token-to-revoke' },
                data: { isRevoked: true },
            });
        });
    });
    describe('revokeAllRefreshTokens', () => {
        it('should revoke all refresh tokens for a user', async () => {
            prismaService.refreshToken.updateMany.mockResolvedValue({ count: 3 });
            await service.revokeAllRefreshTokens(mockUser.id);
            expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
                where: { userId: mockUser.id },
                data: { isRevoked: true },
            });
        });
    });
    describe('rotateRefreshToken', () => {
        it('should rotate refresh token successfully', async () => {
            const payload = { userId: mockUser.id };
            const tokenData = {
                userId: mockUser.id,
                timestamp: Date.now(),
                random: 'random-string',
            };
            // Mock validation of old token
            prismaService.refreshToken.findUnique.mockResolvedValue(mockRefreshTokenRecord);
            encryptionService.decrypt.mockResolvedValue(JSON.stringify(tokenData));
            // Mock revocation of old token
            prismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });
            // Mock generation of new token
            const newEncryptedToken = 'new-encrypted-token';
            encryptionService.encrypt.mockResolvedValue(newEncryptedToken);
            prismaService.refreshToken.create.mockResolvedValue({
                ...mockRefreshTokenRecord,
                token: newEncryptedToken,
            });
            prismaService.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
            prismaService.refreshToken.findMany.mockResolvedValue([]);
            const result = await service.rotateRefreshToken('old-token', payload);
            expect(result).toBe(newEncryptedToken);
        });
    });
    describe('getUserRefreshTokens', () => {
        it('should return active refresh tokens for user', async () => {
            const mockTokens = [
                {
                    id: 'token-1',
                    deviceInfo: 'iPhone 14',
                    ipAddress: '192.168.1.1',
                    userAgent: 'Mozilla/5.0',
                    createdAt: new Date(),
                    expiresAt: (0, date_fns_1.addDays)(new Date(), 30),
                },
            ];
            prismaService.refreshToken.findMany.mockResolvedValue(mockTokens);
            const result = await service.getUserRefreshTokens(mockUser.id);
            expect(result).toEqual(mockTokens);
            expect(prismaService.refreshToken.findMany).toHaveBeenCalledWith({
                where: {
                    userId: mockUser.id,
                    isRevoked: false,
                    expiresAt: { gt: expect.any(Date) },
                },
                select: expect.any(Object),
                orderBy: { createdAt: 'desc' },
            });
        });
    });
    describe('hasReachedTokenLimit', () => {
        it('should return true when user has reached token limit', async () => {
            prismaService.refreshToken.count.mockResolvedValue(5); // Max limit
            const result = await service.hasReachedTokenLimit(mockUser.id);
            expect(result).toBe(true);
        });
        it('should return false when user has not reached token limit', async () => {
            prismaService.refreshToken.count.mockResolvedValue(3);
            const result = await service.hasReachedTokenLimit(mockUser.id);
            expect(result).toBe(false);
        });
    });
    describe('cleanupExpiredTokens', () => {
        it('should cleanup expired and revoked tokens', async () => {
            prismaService.refreshToken.deleteMany.mockResolvedValue({ count: 10 });
            const result = await service.cleanupExpiredTokens();
            expect(result).toBe(10);
            expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { expiresAt: { lt: expect.any(Date) } },
                        { isRevoked: true },
                    ],
                },
            });
        });
    });
});
//# sourceMappingURL=refresh-token.service.test.js.map