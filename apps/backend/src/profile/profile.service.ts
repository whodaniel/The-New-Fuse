import { Injectable } from '@nestjs/common';
import { EventBus } from '../events/event-bus.service.js';
import { StorageService } from '../services/storage.service.js';
import { UsersService } from '../users/users.service.js';
import { ProfileUpdatedEvent } from './events/profile.events.js';

@Injectable()
export class ProfileService {
  constructor(
    private usersService: UsersService,
    private eventBus: EventBus,
    private storageService: StorageService
  ) {}

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    return this.enrichUserProfile(user);
  }

  async updateProfile(userId: string, profileData: any) {
    const user = await this.usersService.update(userId, profileData);
    await this.eventBus.publish(new ProfileUpdatedEvent(userId, profileData));
    return this.enrichUserProfile(user);
  }

  async updateAvatar(userId: string, file: any) {
    const avatarUrl = await this.storageService.uploadFile(
      file?.buffer,
      file?.originalname || `avatar-${userId}`
    );
    return this.usersService.update(userId, { avatarUrl });
  }

  private async enrichUserProfile(user: any) {
    // Add additional profile-related data
    return {
      ...user,
      fullProfile: true,
    };
  }
}
