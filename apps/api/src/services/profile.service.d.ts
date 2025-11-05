import { UsersService } from '../modules/users/users.service';
import { EventBus } from '../modules/events/event-bus.service';
import { StorageService } from '../storage/storage.service';
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
//# sourceMappingURL=profile.service.d.ts.map