/**
 * WebSocket Security Tests
 * Tests for WebSocket authentication, message validation, and security
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { WebSocketGateway } from '../../src/gateways/websocket.gateway';
import { CacheService } from '../../src/cache/cache.service';
import { UnifiedMonitoringService } from '@the-new-fuse/core';
import { AuthService } from '../../src/auth/auth.service';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

// Mock WebSocket client
class MockSocket {
  id: string;
  handshake: any;
  data: any = {};
  
  constructor(id: string, handshake: any = {}) {
    this.id = id;
    this.handshake = handshake;
  }

  emit(event: string, data: any) {
    this.data[event] = data;
  }

  join(room: string) {
    if (!this.data.rooms) this.data.rooms = [];
    this.data.rooms.push(room);
  }

  leave(room: string) {
    if (!this.data.rooms) return;
    this.data.rooms = this.data.rooms.filter((r: string) => r !== room);
  }

  to(room: string) {
    return {
      emit: (event: string, data: any) => {
        console.log(`Mock: Broadcasting to room ${room}: ${event}`, data);
      }
    };
  }

  disconnect() {
    this.disconnected = true;
  }

  disconnected = false;
}

describe('WebSocket Security Tests', () => {
  let app: INestApplication;
  let websocketGateway: WebsocketGateway;
  let cacheService: CacheService;
  let authService: AuthService;
  let monitoringService: UnifiedMonitoringService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
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
            exists: jest.fn(),
            expire: jest.fn(),
            ttl: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            validateToken: jest.fn(),
            getUserFromToken: jest.fn(),
            isTokenExpired: jest.fn(),
          },
        },
        {
          provide: UnifiedMonitoringService,
          useValue: {
            recordMetric: jest.fn(),
            captureError: jest.fn(),
            recordSecurityEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    websocketGateway = moduleRef.get<WebsocketGateway>(WebsocketGateway);
    cacheService = moduleRef.get<CacheService>(CacheService);
    authService = moduleRef.get<AuthService>(AuthService);
    monitoringService = moduleRef.get<UnifiedMonitoringService>(UnifiedMonitoringService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('WebSocket Authentication Security', () => {
    let validSocket: MockSocket;
    let invalidSocket: MockSocket;
    let unauthenticatedSocket: MockSocket;

    beforeEach(() => {
      // Mock valid token
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid.token';
      const invalidToken = 'invalid-token';
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.token';

      validSocket = new MockSocket('valid-socket', {
        auth: { token: validToken },
        headers: { authorization: `Bearer ${validToken}` },
        query: { token: validToken },
      });

      invalidSocket = new MockSocket('invalid-socket', {
        auth: { token: invalidToken },
        query: { token: invalidToken },
      });

      unauthenticatedSocket = new MockSocket('no-auth-socket', {
        query: {},
      });

      // Setup auth service mocks
      (authService.validateToken as jest.Mock).mockImplementation((token: string) => {
        if (token === validToken) {
          return { valid: true, userId: 'user-123', role: 'USER' };
        }
        return { valid: false };
      });
    });

    describe('Connection Authentication', () => {
      it('should accept connections with valid authentication', async () => {
        const result = await (websocketGateway as any).handleConnection(validSocket);
        
        // Should not throw error
        expect(result).toBeUndefined();
        expect(validSocket.disconnected).toBe(false);
      });

      it('should reject connections with invalid tokens', async () => {
        const result = await (websocketGateway as any).handleConnection(invalidSocket);
        
        // Should disconnect invalid socket
        expect(invalidSocket.disconnected).toBe(true);
        expect(monitoringService.recordSecurityEvent).toHaveBeenCalledWith(
          'websocket_auth_failure',
          { socketId: 'invalid-socket', reason: 'invalid_token' }
        );
      });

      it('should reject connections without authentication', async () => {
        const result = await (websocketGateway as any).handleConnection(unauthenticatedSocket);
        
        // Should disconnect unauthenticated socket
        expect(unauthenticatedSocket.disconnected).toBe(true);
        expect(monitoringService.recordSecurityEvent).toHaveBeenCalledWith(
          'websocket_auth_failure',
          { socketId: 'no-auth-socket', reason: 'no_auth' }
        );
      });

      it('should reject connections with expired tokens', async () => {
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.token';
        const expiredSocket = new MockSocket('expired-socket', {
          auth: { token: expiredToken },
          query: { token: expiredToken },
        });

        (authService.isTokenExpired as jest.Mock).mockReturnValue(true);

        const result = await (websocketGateway as any).handleConnection(expiredSocket);
        
        expect(expiredSocket.disconnected).toBe(true);
        expect(monitoringService.recordSecurityEvent).toHaveBeenCalledWith(
          'websocket_auth_failure',
          { socketId: 'expired-socket', reason: 'expired_token' }
        );
      });
    });

    describe('Rate Limiting for Connections', () => {
      it('should limit connection attempts from same IP', async () => {
        const sameIpSockets = Array(10).fill().map((_, i) => 
          new MockSocket(`socket-${i}`, {
            headers: { 'x-forwarded-for': '192.168.1.100' },
            query: { token: 'valid-token' },
          })
        );

        (authService.validateToken as jest.Mock).mockReturnValue({
          valid: true, userId: 'user-123', role: 'USER'
        });

        // First 5 connections should succeed
        for (let i = 0; i < 5; i++) {
          await (websocketGateway as any).handleConnection(sameIpSockets[i]);
          expect(sameIpSockets[i].disconnected).toBe(false);
        }

        // Additional connections should be rate limited
        for (let i = 5; i < 10; i++) {
          await (websocketGateway as any).handleConnection(sameIpSockets[i]);
          expect(sameIpSockets[i].disconnected).toBe(true);
        }
      });
    });
  });

  describe('Message Security', () => {
    let authenticatedSocket: MockSocket;

    beforeEach(() => {
      authenticatedSocket = new MockSocket('auth-socket', {
        auth: { token: 'valid-token' },
        query: { token: 'valid-token' },
      });

      (authService.validateToken as jest.Mock).mockReturnValue({
        valid: true, userId: 'user-123', role: 'USER'
      });
    });

    describe('Message Validation', () => {
      it('should validate message structure', async () => {
        const validMessage = {
          type: 'chat_message',
          content: 'Hello, world!',
          roomId: 'room-123',
        };

        const result = await (websocketGateway as any).handleMessage(
          authenticatedSocket,
          validMessage
        );

        expect(result).toBeDefined();
      });

      it('should reject messages without required fields', async () => {
        const invalidMessages = [
          {}, // Empty message
          { type: 'chat_message' }, // Missing content
          { content: 'Hello' }, // Missing type
          { type: 'chat_message', content: '', roomId: 'room-123' }, // Empty content
        ];

        for (const message of invalidMessages) {
          expect(() => 
            (websocketGateway as any).handleMessage(authenticatedSocket, message)
          ).toThrow();
        }
      });

      it('should reject messages with invalid types', () => {
        const invalidTypes = [
          'undefined',
          'null',
          '1',
          'true',
          'script_injection_attempt',
          '<script>alert("xss")</script>',
        ];

        invalidTypes.forEach(type => {
          expect(() => 
            (websocketGateway as any).handleMessage(authenticatedSocket, {
              type,
              content: 'test',
              roomId: 'room-123',
            })
          ).toThrow();
        });
      });
    });

    describe('XSS Prevention in Messages', () => {
      it('should sanitize malicious content in messages', async () => {
        const xssPayloads = [
          '<script>alert("xss")</script>',
          '<img src="x" onerror="alert(1)">',
          'javascript:alert("xss")',
          '<svg onload="alert(1)">',
          '"><script>alert("xss")</script>',
        ];

        for (const payload of xssPayloads) {
          const result = await (websocketGateway as any).handleMessage(
            authenticatedSocket,
            {
              type: 'chat_message',
              content: payload,
              roomId: 'room-123',
            }
          );

          expect(result.content).not.toContain('<script>');
          expect(result.content).not.toContain('javascript:');
          expect(result.content).not.toContain('onerror=');
        }
      });

      it('should escape HTML entities in messages', async () => {
        const htmlMessage = '<p>Hello & goodbye!</p>';
        
        const result = await (websocketGateway as any).handleMessage(
          authenticatedSocket,
          {
            type: 'chat_message',
            content: htmlMessage,
            roomId: 'room-123',
          }
        );

        expect(result.content).toContain('&lt;p&gt;');
        expect(result.content).toContain('&amp;');
        expect(result.content).toContain('&lt;/p&gt;');
      });
    });

    describe('Message Size Limits', () => {
      it('should reject oversized messages', () => {
        const oversizedContent = 'a'.repeat(10001); // Over 10KB limit
        
        expect(() => 
          (websocketGateway as any).handleMessage(authenticatedSocket, {
            type: 'chat_message',
            content: oversizedContent,
            roomId: 'room-123',
          })
        ).toThrow('Message too large');
      });

      it('should accept messages within size limits', async () => {
        const normalContent = 'a'.repeat(5000); // Under 10KB limit
        
        const result = await (websocketGateway as any).handleMessage(
          authenticatedSocket,
          {
            type: 'chat_message',
            content: normalContent,
            roomId: 'room-123',
          }
        );

        expect(result).toBeDefined();
        expect(result.content).toBe(normalContent);
      });
    });

    describe('SQL Injection Prevention in Messages', () => {
      it('should sanitize SQL injection attempts in message content', async () => {
        const sqlPayloads = [
          "'; DROP TABLE users; --",
          "' OR '1'='1",
          "admin'--",
          "UNION SELECT password FROM users",
        ];

        for (const payload of sqlPayloads) {
          const result = await (websocketGateway as any).handleMessage(
            authenticatedSocket,
            {
              type: 'chat_message',
              content: payload,
              roomId: 'room-123',
            }
          );

          // Content should be sanitized
          expect(result.content).not.toMatch(/DROP TABLE|UNION SELECT/i);
        }
      });
    });
  });

  describe('Room Security', () => {
    let userSocket: MockSocket;
    let adminSocket: MockSocket;

    beforeEach(() => {
      userSocket = new MockSocket('user-socket', {
        auth: { token: 'user-token' },
        query: { token: 'user-token' },
      });

      adminSocket = new MockSocket('admin-socket', {
        auth: { token: 'admin-token' },
        query: { token: 'admin-token' },
      });

      (authService.validateToken as jest.Mock)
        .mockImplementation((token: string) => {
          if (token === 'user-token') {
            return { valid: true, userId: 'user-123', role: 'USER' };
          }
          if (token === 'admin-token') {
            return { valid: true, userId: 'admin-456', role: 'ADMIN' };
          }
          return { valid: false };
        });
    });

    describe('Room Access Control', () => {
      it('should prevent unauthorized room access', async () => {
        const privateRoomId = 'private-admin-room';
        
        // Regular user should not access admin room
        const result = await (websocketGateway as any).handleJoinRoom(
          userSocket,
          { roomId: privateRoomId }
        );

        expect(result.allowed).toBe(false);
        expect(userSocket.data.rooms).toBeUndefined();
      });

      it('should allow authorized room access', async () => {
        const publicRoomId = 'public-room';
        
        const result = await (websocketGateway as any).handleJoinRoom(
          userSocket,
          { roomId: publicRoomId }
        );

        expect(result.allowed).toBe(true);
        expect(userSocket.data.rooms).toContain(publicRoomId);
      });

      it('should allow admins to access admin rooms', async () => {
        const adminRoomId = 'admin-only-room';
        
        const result = await (websocketGateway as any).handleJoinRoom(
          adminSocket,
          { roomId: adminRoomId }
        );

        expect(result.allowed).toBe(true);
        expect(adminSocket.data.rooms).toContain(adminRoomId);
      });
    });

    describe('Room-based Attack Prevention', () => {
      it('should prevent room ID injection attacks', async () => {
        const maliciousRoomIds = [
          '../../../etc/passwd',
          '; DROP TABLE rooms; --',
          "' OR '1'='1",
          '<script>alert("xss")</script>',
        ];

        for (const roomId of maliciousRoomIds) {
          expect(() => 
            (websocketGateway as any).handleJoinRoom(userSocket, { roomId })
          ).toThrow();
        }
      });
    });
  });

  describe('Session Security', () => {
    let socket1: MockSocket;
    let socket2: MockSocket;

    beforeEach(() => {
      socket1 = new MockSocket('socket-1', {
        auth: { token: 'shared-token' },
        query: { token: 'shared-token' },
      });

      socket2 = new MockSocket('socket-2', {
        auth: { token: 'shared-token' },
        query: { token: 'shared-token' },
      });
    });

    it('should handle multiple sessions per user', async () => {
      const token = 'valid-token';
      (authService.validateToken as jest.Mock).mockReturnValue({
        valid: true, userId: 'user-123', role: 'USER'
      });

      // Both sockets should be able to connect
      await (websocketGateway as any).handleConnection(socket1);
      await (websocketGateway as any).handleConnection(socket2);

      expect(socket1.disconnected).toBe(false);
      expect(socket2.disconnected).toBe(false);
    });

    it('should track user sessions properly', () => {
      // Mock user session tracking
      (cacheService.sadd as jest.Mock).mockReturnValue(1);
      (cacheService.scard as jest.Mock).mockReturnValue(2);

      const sessionCount = (websocketGateway as any).getUserSessionCount('user-123');
      expect(sessionCount).toBe(2);
    });
  });

  describe('Error Handling and Monitoring', () => {
    let socket: MockSocket;

    beforeEach(() => {
      socket = new MockSocket('error-test-socket', {
        auth: { token: 'valid-token' },
        query: { token: 'valid-token' },
      });

      (authService.validateToken as jest.Mock).mockReturnValue({
        valid: true, userId: 'user-123', role: 'USER'
      });
    });

    it('should handle WebSocket errors gracefully', async () => {
      // Test error handling
      expect(() => 
        (websocketGateway as any).handleDisconnect(socket)
      ).not.toThrow();
    });

    it('should record security events', async () => {
      await (websocketGateway as any).handleConnection(socket);
      
      // Verify monitoring service was called for security events
      expect(monitoringService.recordSecurityEvent).toHaveBeenCalledWith(
        'websocket_connection',
        { socketId: socket.id, userId: 'user-123' }
      );
    });

    it('should handle malformed handshake data', async () => {
      const malformedSocket = new MockSocket('malformed-socket', {
        auth: null,
        query: { invalid: 'data' },
      });

      await (websocketGateway as any).handleConnection(malformedSocket);
      
      expect(malformedSocket.disconnected).toBe(true);
    });
  });

  describe('Performance and DoS Protection', () => {
    it('should handle connection spikes efficiently', async () => {
      const connectionPromises = Array(100).fill().map((_, i) => {
        const socket = new MockSocket(`spike-socket-${i}`, {
          auth: { token: 'valid-token' },
          query: { token: 'valid-token' },
        });
        return (websocketGateway as any).handleConnection(socket);
      });

      const startTime = Date.now();
      await Promise.allSettled(connectionPromises);
      const endTime = Date.now();

      // Should handle spike within reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should prevent message flooding', async () => {
      const socket = new MockSocket('flood-test-socket', {
        auth: { token: 'valid-token' },
        query: { token: 'valid-token' },
      });

      (authService.validateToken as jest.Mock).mockReturnValue({
        valid: true, userId: 'user-123', role: 'USER'
      });

      await (websocketGateway as any).handleConnection(socket);

      // Send many messages quickly
      const messages = Array(50).fill().map((_, i) => ({
        type: 'chat_message',
        content: `Message ${i}`,
        roomId: 'room-123',
      }));

      const startTime = Date.now();
      
      for (const message of messages) {
        try {
          await (websocketGateway as any).handleMessage(socket, message);
        } catch (error) {
          // Some messages might be rate limited
        }
      }

      const endTime = Date.now();
      
      // Should handle or rate limit within reasonable time
      expect(endTime - startTime).toBeLessThan(3000);
    });
  });
});
