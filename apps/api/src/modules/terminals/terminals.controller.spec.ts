import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { TerminalsController } from './terminals.controller';

describe('TerminalsController', () => {
  const buildController = () =>
    new TerminalsController({
      getTerminalGraph: jest.fn().mockResolvedValue({ available: true }),
    } as any);

  it('forces tenantId from the JWT when the query omits it (regular user)', async () => {
    const controller = buildController();
    const service = (controller as any).terminalsService;
    const result = await controller.getTerminalGraph(
      {
        includeCommands: false,
        includeProcessNodes: true,
        limit: 100,
      },
      {
        user: {
          id: 'user-1',
          tenantId: 'tenant-1',
          role: 'user',
          roles: ['user'],
          permissions: [],
        },
      } as any
    );

    expect(result).toEqual({ available: true });
    expect(service.getTerminalGraph).toHaveBeenCalledWith(
      { tenantId: 'tenant-1', includeCommands: false, includeProcessNodes: true, limit: 100 },
      { viewerUserId: 'user-1' }
    );
  });

  it('rejects tenantId hints that mismatch the authenticated tenant for regular users', async () => {
    const controller = buildController();

    await expect(
      controller.getTerminalGraph(
        {
          tenantId: 'other-tenant',
          includeCommands: false,
          includeProcessNodes: true,
          limit: 100,
        },
        {
          user: {
            id: 'user-1',
            tenantId: 'tenant-1',
            role: 'user',
            roles: ['user'],
            permissions: [],
          },
        } as any
      )
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects regular users whose JWT has no tenantId (fail closed)', async () => {
    const controller = buildController();

    await expect(
      controller.getTerminalGraph(
        {
          includeCommands: false,
          includeProcessNodes: true,
          limit: 100,
        },
        {
          user: {
            id: 'user-1',
            role: 'user',
            roles: ['user'],
            permissions: [],
          },
        } as any
      )
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects requests without an authenticated user id', async () => {
    const controller = buildController();

    await expect(
      controller.getTerminalGraph(
        {
          includeCommands: false,
          includeProcessNodes: true,
          limit: 100,
        },
        { user: { tenantId: 'tenant-1', role: 'user', roles: ['user'] } } as any
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('blocks includeCommands for non-admin users', async () => {
    const controller = buildController();

    await expect(
      controller.getTerminalGraph(
        {
          includeCommands: true,
          includeProcessNodes: true,
          limit: 100,
        },
        {
          user: {
            id: 'user-1',
            tenantId: 'tenant-1',
            role: 'user',
            roles: ['user'],
            permissions: [],
          },
        } as any
      )
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows includeCommands and tenant hints for admin users', async () => {
    const controller = buildController();
    const service = (controller as any).terminalsService;
    const result = await controller.getTerminalGraph(
      {
        tenantId: 'tenant-2',
        includeCommands: true,
        includeProcessNodes: true,
        limit: 100,
      },
      {
        user: {
          id: 'admin-1',
          role: 'admin',
          roles: ['admin'],
          permissions: ['admin:access'],
        },
      } as any
    );

    expect(result).toEqual({ available: true });
    expect(service.getTerminalGraph).toHaveBeenCalledWith(
      { tenantId: 'tenant-2', includeCommands: true, includeProcessNodes: true, limit: 100 },
      { viewerUserId: 'admin-1' }
    );
  });
});
