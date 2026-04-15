import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { SaveProviderKeyDto } from '../dto/provider-keys.dto';

export interface ProviderKeyListItem {
  id: string;
  provider: string;
}

@Injectable()
export class ProviderKeysService {
  constructor(private readonly db: DatabaseService) {}

  async listForUser(userId: string): Promise<ProviderKeyListItem[]> {
    const rows = await this.db.providerApiKeys.listByUser(userId);
    return rows.map((row) => ({
      id: row.id,
      provider: row.provider,
    }));
  }

  async saveForUser(userId: string, dto: SaveProviderKeyDto): Promise<ProviderKeyListItem> {
    const row = await this.db.providerApiKeys.upsert(userId, dto.provider, dto.apiKey);
    return {
      id: row.id,
      provider: row.provider,
    };
  }

  async deleteForUser(userId: string, id: string): Promise<void> {
    const deleted = await this.db.providerApiKeys.deleteByUserAndId(userId, id);
    if (!deleted) {
      throw new NotFoundException('Provider key not found');
    }
  }
}
