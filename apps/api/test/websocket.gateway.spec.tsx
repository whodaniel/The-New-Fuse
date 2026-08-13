import { Test, TestingModule } from '@nestjs/testing';
import { WebsocketGateway } from '../src/websocket/websocket.gateway.js';
import { CacheService } from '../src/cache/cache.service.js';
import { UnifiedMonitoringService } from '@the-new-fuse/core';
import { Socket } from 'socket.io';

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;
  let cacheService: CacheService;

  const mockSocket = {
    id: 'test-socket-id',
    handshake: {
      auth: {
        token: 'test-user-id'
      }
    },
    disconnect: jest.fn(),
    emit: jest.fn(),
  } as unknown as Socket;

  const mockServer = {
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketGateway,
        {
          provide: CacheService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            sadd: jest.fn(),
            srem: jest.fn(),
            scard: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: UnifiedMonitoringService,
          useValue: {
            recordMetric: jest.fn(),
            captureError: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<WebsocketGateway>(WebsocketGateway);
    gateway.server = mockServer as any;
    cacheService = module.get<CacheService>(CacheService);
  });

  describe('handleConnection', () => {
    it('should handle new connection successfully', async () => {
      await gateway.handleConnection(mockSocket);

      expect(cacheService.set).toHaveBeenCalledWith(
        'socket:test-socket-id',
        'test-user-id'
      );
      expect(cacheService.sadd).toHaveBeenCalledWith(
        'online_users',
        'test-user-id'
      );
      expect(mockServer.emit).toHaveBeenCalled();
    });

    it('should disconnect client on error', async () => {
      jest.spyOn(cacheService, 'set').mockRejectedValue(new Error());

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleMessage', () => {
    it('should broadcast message to room', async () => {
      const payload = {
        roomId: 'test-room',
        agentId: 'test-agent',
        content: 'test message'
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue('test-user-id');

      await gateway.handleMessage(mockSocket, payload);

      expect(mockServer.to).toHaveBeenCalledWith('test-room');
      expect(mockServer.emit).toHaveBeenCalled();
    });
  });
});