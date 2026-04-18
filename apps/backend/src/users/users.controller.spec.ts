import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/profile.dto.js';
import { UpdateUserDto } from './dto/user.dto.js';
import { ForbiddenException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
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
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const userId = 'usr_123';
      const mockProfile = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        bio: 'Test bio',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getProfile(userId);

      expect(result).toEqual(mockProfile);
      expect(service.getProfile).toHaveBeenCalledWith(userId);
      expect(service.getProfile).toHaveBeenCalledTimes(1);
    });

    it('should throw error if user not found', async () => {
      mockUsersService.getProfile.mockRejectedValue(new Error('User not found'));

      await expect(controller.getProfile('invalid_id')).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile when user owns it', async () => {
      const userId = 'usr_123';
      const updateDto: UpdateProfileDto = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
      };

      const mockUpdatedProfile = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        ...updateDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.updateProfile.mockResolvedValue(mockUpdatedProfile);

      const result = await controller.updateProfile(userId, updateDto, { user: { id: userId } } as any);

      expect(result).toEqual(mockUpdatedProfile);
      expect(service.updateProfile).toHaveBeenCalledWith(userId, updateDto);
      expect(service.updateProfile).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenException when updating another user profile', async () => {
      const targetUserId = 'target_user_123';
      const attackerUserId = 'attacker_456';
      const updateDto: UpdateProfileDto = { displayName: 'Hacked Name' };

      await expect(
        controller.updateProfile(targetUserId, updateDto, { user: { id: attackerUserId } } as any)
      ).rejects.toThrow(ForbiddenException);

      expect(service.updateProfile).not.toHaveBeenCalled();
    });

    it('should update profile with partial data', async () => {
      const userId = 'usr_123';
      const updateDto: UpdateProfileDto = {
        bio: 'Only updating bio',
      };

      const mockUpdatedProfile = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        bio: updateDto.bio,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.updateProfile.mockResolvedValue(mockUpdatedProfile);

      const result = await controller.updateProfile(userId, updateDto, { user: { id: userId } } as any);

      expect(result).toEqual(mockUpdatedProfile);
      expect(service.updateProfile).toHaveBeenCalledWith(userId, updateDto);
    });
  });

  describe('update', () => {
    it('should update user account when user owns it', async () => {
      const userId = 'usr_123';
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockUpdatedUser = {
        id: userId,
        ...updateDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.update.mockResolvedValue(mockUpdatedUser);

      const result = await controller.update(userId, updateDto, { user: { id: userId } } as any);

      expect(result).toEqual(mockUpdatedUser);
      expect(service.update).toHaveBeenCalledWith(userId, updateDto);
    });

    it('should throw ForbiddenException when updating another user account', async () => {
      const targetUserId = 'target_user_123';
      const attackerUserId = 'attacker_456';
      const updateDto: UpdateUserDto = {
        name: 'Hacked Name',
        email: 'hacked@example.com',
        password: 'Password123!',
      };

      await expect(
        controller.update(targetUserId, updateDto, { user: { id: attackerUserId } } as any)
      ).rejects.toThrow(ForbiddenException);

      expect(service.update).not.toHaveBeenCalled();
    });
  });
});
