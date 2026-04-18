import { DatabaseService } from '@the-new-fuse/database/drizzle';
import { ResourceInteractionService } from './resource-interaction.service';

describe('ResourceInteractionService', () => {
  it('creates a favorite when none exists', async () => {
    const selectLimit = jest.fn().mockResolvedValue([]);
    const selectWhere = jest.fn().mockReturnValue({ limit: selectLimit });
    const selectFrom = jest.fn().mockReturnValue({ where: selectWhere });
    const select = jest.fn().mockReturnValue({ from: selectFrom });
    const insertValues = jest.fn().mockResolvedValue([]);
    const insert = jest.fn().mockReturnValue({ values: insertValues });
    const db = {
      client: {
        select,
        insert,
      },
    } as unknown as DatabaseService;
    const service = new ResourceInteractionService(db);

    const result = await service.toggleFavorite('agent-alpha', 'user-1');

    expect(result.favorite).toBe(true);
    expect(insertValues).toHaveBeenCalledWith({
      resourceId: 'agent-alpha',
      userId: 'user-1',
    });
  });

  it('removes a favorite when existing record is found', async () => {
    const selectLimit = jest.fn().mockResolvedValue([{ id: 'fav_existing' }]);
    const selectWhere = jest.fn().mockReturnValue({ limit: selectLimit });
    const selectFrom = jest.fn().mockReturnValue({ where: selectWhere });
    const select = jest.fn().mockReturnValue({ from: selectFrom });
    const deleteWhere = jest.fn().mockResolvedValue([]);
    const deleteFn = jest.fn().mockReturnValue({ where: deleteWhere });
    const db = {
      client: {
        select,
        delete: deleteFn,
      },
    } as unknown as DatabaseService;
    const service = new ResourceInteractionService(db);

    const result = await service.toggleFavorite('agent-alpha', 'user-1');

    expect(result.favorite).toBe(false);
    expect(deleteWhere).toHaveBeenCalledTimes(1);
  });

  it('persists resource share records', async () => {
    const returning = jest.fn().mockResolvedValue([
      {
        id: 'share-id',
        resourceId: 'agent-alpha',
        fromUserId: 'user-1',
        toAgentId: 'agent-beta',
        notes: 'review this',
        sharedAt: new Date('2026-03-18T21:00:00Z'),
      },
    ]);
    const insertValues = jest.fn().mockReturnValue({ returning });
    const insert = jest.fn().mockReturnValue({ values: insertValues });
    const db = {
      client: {
        insert,
      },
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
    expect(result.id).toBe('share-id');
    expect(insertValues).toHaveBeenCalledWith({
      resourceId: 'agent-alpha',
      fromUserId: 'user-1',
      toAgentId: 'agent-beta',
      notes: 'review this',
    });
  });
});
