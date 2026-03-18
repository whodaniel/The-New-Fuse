import { DatabaseService } from '@the-new-fuse/database/drizzle';
import { ResourceInteractionService } from './resource-interaction.service';

describe('ResourceInteractionService', () => {
  it('creates a favorite when none exists', async () => {
    const db = {
      executeRaw: jest.fn().mockResolvedValue([]),
    } as unknown as DatabaseService;
    const service = new ResourceInteractionService(db);

    const result = await service.toggleFavorite('agent-alpha', 'user-1');

    expect(result.favorite).toBe(true);
    expect(
      (db.executeRaw as jest.Mock).mock.calls.some(([query]) =>
        query.includes('INSERT INTO resource_favorites')
      )
    ).toBe(true);
  });

  it('removes a favorite when existing record is found', async () => {
    const executeRaw = jest.fn().mockImplementation(async (query: string) => {
      if (query.includes('SELECT id') && query.includes('resource_favorites')) {
        return [{ id: 'fav_existing' }];
      }
      return [];
    });
    const db = {
      executeRaw,
    } as unknown as DatabaseService;
    const service = new ResourceInteractionService(db);

    const result = await service.toggleFavorite('agent-alpha', 'user-1');

    expect(result.favorite).toBe(false);
    expect(
      executeRaw.mock.calls.some(([query]) => query.includes('DELETE FROM resource_favorites'))
    ).toBe(true);
  });

  it('persists resource share records', async () => {
    const db = {
      executeRaw: jest.fn().mockResolvedValue([]),
    } as unknown as DatabaseService;
    const service = new ResourceInteractionService(db);

    const result = await service.shareResource({
      resourceId: 'agent-alpha',
      fromUserId: 'user-1',
      toAgentId: 'agent-beta',
      notes: 'review this',
    });

    expect(result.resourceId).toBe('agent-alpha');
    expect(result.fromUserId).toBe('user-1');
    expect(result.toAgentId).toBe('agent-beta');
    expect(
      (db.executeRaw as jest.Mock).mock.calls.some(([query]) =>
        query.includes('INSERT INTO resource_shares')
      )
    ).toBe(true);
  });
});
