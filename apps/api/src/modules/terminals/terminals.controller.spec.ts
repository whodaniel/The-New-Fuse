import { ForbiddenException } from '@nestjs/common';
import { TerminalsController } from './terminals.controller.js';

describe('TerminalsController', () => {
  const buildController = () =>
    new TerminalsController({
      getTerminalGraph: jest.fn().mockResolvedValue({ available: true }),
    } as any);

  it('allows redacted graph for regular user', async () => {
    const controller = buildController();
    const result = await controller.getTerminalGraph(
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
    );

    expect(result).toEqual({ available: true });
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
            role: 'user',
            roles: ['user'],
            permissions: [],
          },
        } as any
      )
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows includeCommands for admin users', async () => {
    const controller = buildController();
    const result = await controller.getTerminalGraph(
      {
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
  });
});

