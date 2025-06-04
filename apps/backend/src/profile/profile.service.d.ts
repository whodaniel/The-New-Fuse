import { UsersService } from '../users/users.service.js';
import { EventBus } from '../events/event-bus.service.js';
import { StorageService } from '../services/storage.service.js';
export declare class ProfileService {
    private usersService;
    private eventBus;
    private storageService;
    constructor(usersService: UsersService, eventBus: EventBus, storageService: StorageService);
    getProfile(userId: string): Promise<any>;
    updateProfile(userId: string, profileData: any): Promise<any>;
    updateAvatar(userId: string, file: Express.Multer.File): Promise<any>;
    private enrichUserProfile;
}
