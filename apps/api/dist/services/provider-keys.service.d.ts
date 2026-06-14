import { DatabaseService } from '@the-new-fuse/database';
import { SaveProviderKeyDto } from '../dto/provider-keys.dto';
export interface ProviderKeyListItem {
    id: string;
    provider: string;
}
export declare class ProviderKeysService {
    private readonly db;
    constructor(db: DatabaseService);
    listForUser(userId: string): Promise<ProviderKeyListItem[]>;
    saveForUser(userId: string, dto: SaveProviderKeyDto): Promise<ProviderKeyListItem>;
    deleteForUser(userId: string, id: string): Promise<void>;
}
//# sourceMappingURL=provider-keys.service.d.ts.map