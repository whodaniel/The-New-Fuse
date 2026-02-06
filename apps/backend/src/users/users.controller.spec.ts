import { Test, TestingModule } from '@nestjs/testing';
import { UpdateProfileDto } from './dto/profile.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

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
    it('should update user profile', async () => {
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

      const result = await controller.updateProfile(userId, updateDto);

      expect(result).toEqual(mockUpdatedProfile);
      expect(service.updateProfile).toHaveBeenCalledWith(userId, updateDto);
      expect(service.updateProfile).toHaveBeenCalledTimes(1);
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

      const result = await controller.updateProfile(userId, updateDto);

      expect(result).toEqual(mockUpdatedProfile);
      expect(service.updateProfile).toHaveBeenCalledWith(userId, updateDto);
    });
  });
});
