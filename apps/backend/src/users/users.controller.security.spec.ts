import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/profile.dto';
import { ForbiddenException } from '@nestjs/common';

describe('UsersController Security', () => {
  let controller: UsersController;

  const mockUsersService = {
    update: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('update', () => {
    it('should throw ForbiddenException when updating another user', async () => {
      const targetUserId = 'target-user-id';
      const maliciousUserId = 'malicious-user-id';
      const updateDto = { email: 'hacked@example.com' } as any;

      const mockRequest = {
        user: { id: maliciousUserId },
      };

      await expect(
        controller.update(targetUserId, updateDto, mockRequest as any)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateProfile', () => {
    it('should throw ForbiddenException when updating another user profile', async () => {
      const targetUserId = 'target-user-id';
      const maliciousUserId = 'malicious-user-id';
      const updateDto: UpdateProfileDto = { bio: 'Hacked bio' };

      const mockRequest = {
        user: { id: maliciousUserId },
      };

      await expect(
        controller.updateProfile(targetUserId, updateDto, mockRequest as any)
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
