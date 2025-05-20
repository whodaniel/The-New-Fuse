import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { EventBus } from '../events/event-bus.service.js';
import { ProfileUpdatedEvent } from './events/profile.events.js';
import { StorageService } from '../services/storage.service.js';

@Injectable()
export class ProfileService {
  constructor(
    private usersService: UsersService,
    private eventBus: EventBus,
    private storageService: StorageService
  ) {}

  async getProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    return this.enrichUserProfile(user);
  }

  async updateProfile(userId: string, profileData: any) {
    const user = await this.usersService.update(userId, profileData);
    await this.eventBus.publish(new ProfileUpdatedEvent(user));
    return this.enrichUserProfile(user);
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const avatarUrl = await this.storageService.uploadFile(file);
    return this.usersService.update(userId, { avatarUrl });
  }

  private async enrichUserProfile(user: any) {
    // Add additional profile-related data
    return {
      ...user,
      fullProfile: true
    };
  }
}