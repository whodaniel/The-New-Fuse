import { SaveProviderKeyDto } from '../dto/provider-keys.dto';
import { ProviderKeyListItem, ProviderKeysService } from '../services/provider-keys.service';
export declare class ProviderKeysController {
    private readonly providerKeysService;
    constructor(providerKeysService: ProviderKeysService);
    list(user: {
        id: string;
    }): Promise<ProviderKeyListItem[]>;
    save(user: {
        id: string;
    }, dto: SaveProviderKeyDto): Promise<ProviderKeyListItem>;
    remove(user: {
        id: string;
    }, id: string): Promise<{
        success: true;
    }>;
}
//# sourceMappingURL=provider-keys.controller.d.ts.map