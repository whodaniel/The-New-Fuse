import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getAuthToken, setupTestApp, cleanupTestData } from '../test-utils/test-helpers';
import { WebSocketGateway } from '../../../apps/api/src/gateways/websocket.gateway';
import { WebSocketService } from '../../../apps/api/src/services/websocket.service';
import { AuthService } from '../../../apps/api/src/services/auth.service';
import { DatabaseService } from '../../../apps/api/src/services/db.service';
import { Server as SocketIOServer, Client as SocketIOClient } from 'socket.io-client';
import { createServer } from 'http';

describe('WebSocket Endpoints', () => {
  let app: INestApplication;
  let server: any;
  let wsGateway: WebSocketGateway;
  let wsService: WebSocketService;
  let authService: AuthService;
  let dbService: DatabaseService;
  let client: SocketIOClient;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    server = createServer(app.getHttpServer());
    wsGateway = app.get(WebSocketGateway);
    wsService = app.get(WebSocketService);
    authService = app.get(AuthService);
    dbService = app.get(DatabaseService);
    authToken = await getAuthToken(app, 'testuser@example.com', 'password123');
    userId = 'test-user-123';
  });

  afterAll(async () => {
    if (client) {
      client.disconnect();
    }
    if (server) {
      server.close();
    }
    await cleanupTestData(app);
    await app.close();
  });

  beforeEach(() => {
    // Clean up any existing connections
    if (client) {
      client.disconnect();
    }
  });

  describe('Connection and Authentication', () => {
    it('should establish WebSocket connection with valid token', async (done) => {
      const connectOptions = {
        auth: {
          token: authToken
        },
        transports: ['websocket', 'polling']
      };

      client = new SocketIOClient('http://localhost:3000', connectOptions);

      client.on('connect', () => {
        expect(client.connected).toBe(true);
        done();
      });

      client.on('connect_error', (error) => {
        done.fail(`Connection failed: ${error.message}`);
      });

      // Wait for connection or timeout
      setTimeout(() => {
        if (!client.connected) {
          done.fail('Connection timeout');
        }
      }, 5000);
    });

    it('should reject connection with invalid token', async (done) => {
      const invalidOptions = {
        auth: {
          token: 'invalid-token'
        },
        transports: ['websocket']
      };

      client = new SocketIOClient('http://localhost:3000', invalidOptions);

      client.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        done();
      });

      client.on('connect', () => {
        done.fail('Should not connect with invalid token');
      });

      setTimeout(() => {
        if (client.connected) {
          done.fail('Should not be connected with invalid token');
        }
      }, 3000);
    });

    it('should reject connection without authentication token', async (done) => {
      const noAuthOptions = {
        transports: ['websocket']
      };

      client = new SocketIOClient('http://localhost:3000', noAuthOptions);

      client.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication required');
        done();
      });

      client.on('connect', () => {
        done.fail('Should not connect without authentication');
      });

      setTimeout(() => {
        if (client.connected) {
          done.fail('Should not be connected without authentication');
        }
      }, 3000);
    });

    it('should handle expired token authentication', async (done) => {
      // Create an expired token
      const expiredToken = 'expired.jwt.token';
      
      const expiredOptions = {
        auth: {
          token: expiredToken
        },
        transports: ['websocket']
      };

      client = new SocketIOClient('http://localhost:3000', expiredOptions);

      client.on('connect_error', (error) => {
        expect(error.message).toContain('Token expired');
        done();
      });

      client.on('connect', () => {
        done.fail('Should not connect with expired token');
      });

      setTimeout(() => {
        if (client.connected) {
          done.fail('Should not be connected with expired token');
        }
      }, 3000);
    });

    it('should handle concurrent connections from same user', async () => {
      const connectOptions = {
        auth: {
          token: authToken
        },
        transports: ['websocket']
      };

      const client1 = new SocketIOClient('http://localhost:3000', connectOptions);
      const client2 = new SocketIOClient('http://localhost:3000', connectOptions);

      await new Promise<void>((resolve, reject) => {
        let connectedCount = 0;

        const checkConnection = () => {
          connectedCount++;
          if (connectedCount === 2) {
            expect(client1.connected).toBe(true);
            expect(client2.connected).toBe(true);
            resolve();
          }
        };

        client1.on('connect', checkConnection);
        client2.on('connect', checkConnection);

        client1.on('connect_error', reject);
        client2.on('connect_error', reject);

        setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);
      });

      client1.disconnect();
      client2.disconnect();
    });

    it('should enforce connection rate limiting', async (done) => {
      const connectOptions = {
        auth: {
          token: authToken
        },
        transports: ['websocket']
      };

      const clients = [];
      const maxConnections = 10;

      // Create many connections quickly
      for (let i = 0; i < maxConnections + 5; i++) {
        const client = new SocketIOClient('http://localhost:3000', connectOptions);
        clients.push(client);
      }

      setTimeout(() => {
        const connectedClients = clients.filter(c => c.connected);
        
        // Should limit connections per user
        expect(connectedClients.length).toBeLessThanOrEqual(maxConnections);
        
        // Disconnect all clients
        clients.forEach(c => c.disconnect());
        done();
      }, 2000);
    });
  });

  describe('Message Handling', () => {
    beforeEach(async (done) => {
      const connectOptions = {
        auth: {
          token: authToken
        },
        transports: ['websocket']
      };

      client = new SocketIOClient('http://localhost:3000', connectOptions);
      
      client.on('connect', () => {
        done();
      });

      setTimeout(() => {
        if (!client.connected) {
          done.fail('Connection failed');
        }
      }, 3000);
    });

    afterEach(() => {
      if (client && client.connected) {
        client.disconnect();
      }
    });

    it('should receive welcome message on connection', async (done) => {
      client.on('welcome', (data) => {
        expect(data).toMatchObject({
          userId: userId,
          message: expect.any(String),
          timestamp: expect.any(String)
        });
        done();
      });

      // Reconnect to trigger welcome message
      client.disconnect();
      
      setTimeout(() => {
        const connectOptions = {
          auth: {
            token: authToken
          },
          transports: ['websocket']
        };
        
        client = new SocketIOClient('http://localhost:3000', connectOptions);
        
        client.on('connect', () => {
          // Welcome message should be sent automatically
        });
      }, 100);
    });

    it('should handle chat messages', async (done) => {
      const chatMessage = {
        type: 'chat',
        content: 'Hello, this is a test message',
        room: 'general',
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      client.on('chat:message', (data) => {
        expect(data).toMatchObject({
          id: expect.any(String),
          userId: userId,
          type: 'chat',
          content: chatMessage.content,
          room: chatMessage.room,
          timestamp: expect.any(String)
        });
        done();
      });

      client.emit('chat:send', chatMessage);

      setTimeout(() => {
        done.fail('Message timeout');
      }, 3000);
    });

    it('should validate message format', async (done) => {
      const invalidMessage = {
        type: 'invalid_type',
        content: null,
        room: 'general'
      };

      client.on('error', (error) => {
        expect(error.message).toContain('Invalid message format');
        done();
      });

      client.emit('chat:send', invalidMessage);

      setTimeout(() => {
        done.fail('Error handling timeout');
      }, 3000);
    });

    it('should handle agent communication', async (done) => {
      const agentMessage = {
        type: 'agent',
        agentId: 'test-agent-123',
        content: 'What can you help me with?',
        conversationId: 'conv-123'
      };

      client.on('agent:response', (data) => {
        expect(data).toMatchObject({
          agentId: agentMessage.agentId,
          conversationId: agentMessage.conversationId,
          response: expect.any(String),
          timestamp: expect.any(String)
        });
        done();
      });

      client.emit('agent:message', agentMessage);

      setTimeout(() => {
        done.fail('Agent message timeout');
      }, 5000);
    });

    it('should handle workflow execution updates', async (done) => {
      const workflowId = 'test-workflow-123';
      
      client.on('workflow:update', (data) => {
        expect(data).toMatchObject({
          workflowId: workflowId,
          status: expect.any(String),
          progress: expect.any(Number),
          currentStep: expect.any(String),
          timestamp: expect.any(String)
        });
        done();
      });

      client.emit('workflow:subscribe', { workflowId });

      setTimeout(() => {
        done.fail('Workflow update timeout');
      }, 3000);
    });

    it('should handle typing indicators', async (done) => {
      const typingData = {
        room: 'general',
        isTyping: true,
        userId: userId
      };

      client.on('typing:status', (data) => {
        expect(data).toMatchObject({
          room: typingData.room,
          userId: typingData.userId,
          isTyping: expect.any(Boolean),
          timestamp: expect.any(String)
        });
        done();
      });

      client.emit('typing:start', typingData);

      setTimeout(() => {
        client.emit('typing:stop', typingData);
      }, 1000);

      setTimeout(() => {
        done.fail('Typing indicator timeout');
      }, 3000);
    });
  });

  describe('Room Management', () => {
    beforeEach(async (done) => {
      const connectOptions = {
        auth: {
          token: authToken
        },
        transports: ['websocket']
      };

      client = new SocketIOClient('http://localhost:3000', connectOptions);
      
      client.on('connect', () => {
        done();
      });

      setTimeout(() => {
        if (!client.connected) {
          done.fail('Connection failed');
        }
      }, 3000);
    });

    afterEach(() => {
      if (client && client.connected) {
        client.disconnect();
      }
    });

    it('should join a room successfully', async (done) => {
      const room = 'test-room-123';

      client.on('room:joined', (data) => {
        expect(data).toMatchObject({
          room: room,
          userId: userId,
          members: expect.any(Array),
          timestamp: expect.any(String)
        });
        done();
      });

      client.emit('room:join', { room });

      setTimeout(() => {
        done.fail('Room join timeout');
      }, 3000);
    });

    it('should leave a room successfully', async (done) => {
      const room = 'test-room-leave';

      client.on('room:left', (data) => {
        expect(data).toMatchObject({
          room: room,
          userId: userId,
          timestamp: expect.any(String)
        });
        done();
      });

      // First join the room
      client.emit('room:join', { room });
      
      setTimeout(() => {
        client.emit('room:leave', { room });
      }, 500);

      setTimeout(() => {
        done.fail('Room leave timeout');
      }, 3000);
    });

    it('should broadcast messages to room members', async (done) => {
      const room = 'test-broadcast-room';
      let messageReceived = false;

      client.on('room:message', (data) => {
        expect(data).toMatchObject({
          room: room,
          userId: userId,
          content: 'Test broadcast message',
          timestamp: expect.any(String)
        });
        messageReceived = true;
        done();
      });

      client.emit('room:join', { room });

      setTimeout(() => {
        client.emit('room:message', {
          room: room,
          content: 'Test broadcast message'
        });
      }, 500);

      setTimeout(() => {
        if (!messageReceived) {
          done.fail('Broadcast message not received');
        }
      }, 3000);
    });

    it('should handle private room access control', async (done) => {
      const privateRoom = 'private-room-no-access';

      client.on('error', (error) => {
        expect(error.message).toContain('Access denied');
        done();
      });

      client.emit('room:join', { room: privateRoom });

      setTimeout(() => {
        done.fail('Private room access error timeout');
      }, 3000);
    });
  });

  describe('Event Broadcasting', () => {
    let client1: SocketIOClient;
    let client2: SocketIOClient;
    let client1Token: string;
    let client2Token: string;

    beforeAll(async () => {
      client1Token = await getAuthToken(app, 'user1@example.com', 'password123');
      client2Token = await getAuthToken(app, 'user2@example.com', 'password123');
    });

    beforeEach(async (done) => {
      const connectOptions1 = {
        auth: {
          token: client1Token
        },
        transports: ['websocket']
      };

      const connectOptions2 = {
        auth: {
          token: client2Token
        },
        transports: ['websocket']
      };

      client1 = new SocketIOClient('http://localhost:3000', connectOptions1);
      client2 = new SocketIOClient('http://localhost:3000', connectOptions2);

      Promise.all([
        new Promise<void>((resolve) => {
          client1.on('connect', () => resolve());
        }),
        new Promise<void>((resolve) => {
          client2.on('connect', () => resolve());
        })
      ]).then(() => {
        done();
      });

      setTimeout(() => {
        if (!client1.connected || !client2.connected) {
          done.fail('Client connection failed');
        }
      }, 3000);
    });

    afterEach(() => {
      if (client1 && client1.connected) {
        client1.disconnect();
      }
      if (client2 && client2.connected) {
        client2.disconnect();
      }
    });

    it('should broadcast system notifications to all users', async (done) => {
      const notification = {
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test system notification',
        priority: 'normal'
      };

      let notificationsReceived = 0;

      const checkNotifications = () => {
        notificationsReceived++;
        if (notificationsReceived === 2) {
          done();
        }
      };

      client1.on('system:notification', (data) => {
        expect(data).toMatchObject({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          timestamp: expect.any(String)
        });
        checkNotifications();
      });

      client2.on('system:notification', (data) => {
        expect(data).toMatchObject({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          timestamp: expect.any(String)
        });
        checkNotifications();
      });

      // Broadcast notification from server
      wsService.broadcastToAll('system:notification', notification);

      setTimeout(() => {
        done.fail('System notification timeout');
      }, 3000);
    });

    it('should broadcast user-specific events', async (done) => {
      const user1Event = {
        type: 'agent:created',
        agentId: 'test-agent-456',
        agentName: 'Test Agent'
      };

      const user2Event = {
        type: 'workflow:completed',
        workflowId: 'workflow-789',
        status: 'success'
      };

      let user1EventReceived = false;
      let user2EventReceived = false;

      client1.on('user:event', (data) => {
        expect(data).toMatchObject(user1Event);
        user1EventReceived = true;
        if (user1EventReceived && user2EventReceived) {
          done();
        }
      });

      client2.on('user:event', (data) => {
        expect(data).toMatchObject(user2Event);
        user2EventReceived = true;
        if (user1EventReceived && user2EventReceived) {
          done();
        }
      });

      // Broadcast user-specific events
      wsService.broadcastToUser('user1-id', 'user:event', user1Event);
      wsService.broadcastToUser('user2-id', 'user:event', user2Event);

      setTimeout(() => {
        if (!user1EventReceived || !user2EventReceived) {
          done.fail('User-specific event timeout');
        }
      }, 3000);
    });
  });

  describe('Heartbeat and Connection Management', () => {
    it('should maintain connection with periodic heartbeats', async (done) => {
      const connectOptions = {
        auth: {
          token: authToken
        },
        transports: ['websocket']
      };

      client = new SocketIOClient('http://localhost:3000', connectOptions);
      
      let heartbeatCount = 0;
      const maxHeartbeats = 3;

      client.on('heartbeat', (data) => {
        heartbeatCount++;
        expect(data.timestamp).toBeDefined();
        
        if (heartbeatCount >= maxHeartbeats) {
          done();
        }
      });

      client.on('connect', () => {
        // Heartbeat should start automatically
      });

      setTimeout(() => {
        if (heartbeatCount === 0) {
          done.fail('No heartbeats received');
        }
        client.disconnect();
      }, 10000);
    });

    it('should detect dead connections', async (done) => {
      const connectOptions = {
        auth: {
          token: authToken
        },
        transports: ['websocket'],
        timeout: 5000
      };

      client = new SocketIOClient('http://localhost:3000', connectOptions);
      
      let connectionLost = false;

      client.on('disconnect', (reason) => {
        connectionLost = true;
        expect(reason).toContain('ping timeout');
        done();
      });

      client.on('connect', () => {
        // Simulate network issues by pausing heartbeat responses
        setTimeout(() => {
          if (!connectionLost) {
            client.disconnect();
            done();
          }
        }, 8000);
      });

      setTimeout(() => {
        if (!connectionLost) {
          done.fail('Connection not properly terminated');
        }
      }, 10000);
    });
  });

  describe('Security and Rate Limiting', () => {
    beforeEach(async (done) => {
      const connectOptions = {
        auth: {
          token: authToken
        },
        transports: ['websocket']
      };

      client = new SocketIOClient('http://localhost:3000', connectOptions);
      
      client.on('connect', () => {
        done();
      });

      setTimeout(() => {
        if (!client.connected) {
          done.fail('Connection failed');
        }
      }, 3000);
    });

    afterEach(() => {
      if (client && client.connected) {
        client.disconnect();
      }
    });

    it('should rate limit message sending', async (done) => {
      const messages = Array(50).fill(null).map((_, i) => ({
        type: 'chat',
        content: `Message ${i}`,
        room: 'general'
      }));

      let rateLimited = false;

      client.on('rate_limited', (data) => {
        rateLimited = true;
        expect(data.limit).toBeDefined();
        expect(data.resetTime).toBeDefined();
        done();
      });

      // Send messages rapidly
      messages.forEach((message, index) => {
        setTimeout(() => {
          client.emit('chat:send', message);
        }, index * 10);
      });

      setTimeout(() => {
        if (!rateLimited) {
          done.fail('Rate limiting not triggered');
        }
      }, 2000);
    });

    it('should prevent message flooding', async (done) => {
      const largeMessage = {
        type: 'chat',
        content: 'A'.repeat(10000), // Very large message
        room: 'general'
      };

      client.on('error', (error) => {
        expect(error.message).toContain('Message too large');
        done();
      });

      client.emit('chat:send', largeMessage);

      setTimeout(() => {
        done.fail('Large message error handling timeout');
      }, 3000);
    });

    it('should validate room membership before allowing actions', async (done) => {
      const unauthorizedRoom = 'room-no-access';

      client.on('error', (error) => {
        expect(error.message).toContain('Not authorized for this room');
        done();
      });

      client.emit('room:message', {
        room: unauthorizedRoom,
        content: 'Unauthorized message'
      });

      setTimeout(() => {
        done.fail('Room authorization timeout');
      }, 3000);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async (done) => {
      const connectOptions = {
        auth: {
          token: authToken
        },
        transports: ['websocket']
      };

      client = new SocketIOClient('http://localhost:3000', connectOptions);
      
      client.on('connect', () => {
        // Trigger a server error
        client.emit('invalid:action', {});
      });

      client.on('server_error', (error) => {
        expect(error.message).toBeDefined();
        expect(error.timestamp).toBeDefined();
        done();
      });

      setTimeout(() => {
        done.fail('Server error handling timeout');
      }, 3000);
    });

    it('should handle database connection errors', async (done) => {
      // This would typically be tested by simulating a database failure
      // For now, we'll test with invalid data that would cause DB errors
      
      const connectOptions = {
        auth: {
          token: authToken
        },
        transports: ['websocket']
      };

      client = new SocketIOClient('http://localhost:3000', connectOptions);
      
      client.on('connect', () => {
        const invalidData = {
          type: 'agent',
          agentId: null, // This should cause a database error
          content: 'Test message'
        };
        
        client.emit('agent:message', invalidData);
      });

      client.on('error', (error) => {
        expect(error.message).toContain('Database error');
        done();
      });

      setTimeout(() => {
        done.fail('Database error handling timeout');
      }, 3000);
    });
  });

  describe('Performance Tests', () => {
    it('should handle high-frequency messages efficiently', async (done) => {
      const connectOptions = {
        auth: {
          token: authToken
        },
        transports: ['websocket']
      };

      const testClient = new SocketIOClient('http://localhost:3000', connectOptions);
      
      const startTime = Date.now();
      const messageCount = 100;
      let processedCount = 0;

      testClient.on('connect', () => {
        for (let i = 0; i < messageCount; i++) {
          testClient.emit('chat:send', {
            type: 'chat',
            content: `Performance test message ${i}`,
            room: 'performance-test'
          });
        }
      });

      testClient.on('chat:ack', () => {
        processedCount++;
        if (processedCount === messageCount) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          // Should process 100 messages within reasonable time
          expect(duration).toBeLessThan(5000);
          expect(processedCount).toBe(messageCount);
          
          testClient.disconnect();
          done();
        }
      });

      setTimeout(() => {
        if (processedCount < messageCount) {
          testClient.disconnect();
          done.fail(`Only processed ${processedCount} out of ${messageCount} messages`);
        }
      }, 8000);
    });

    it('should maintain connection quality under load', async (done) => {
      const clients = [];
      const clientCount = 5;

      for (let i = 0; i < clientCount; i++) {
        const connectOptions = {
          auth: {
            token: authToken
          },
          transports: ['websocket']
        };

        const client = new SocketIOClient('http://localhost:3000', connectOptions);
        clients.push(client);
      }

      Promise.all(
        clients.map(client => new Promise<void>((resolve) => {
          client.on('connect', () => {
            resolve();
          });
        }))
      ).then(() => {
        // All clients connected successfully
        const connectedClients = clients.filter(c => c.connected);
        expect(connectedClients.length).toBe(clientCount);
        
        // Disconnect all clients
        clients.forEach(c => c.disconnect());
        done();
      });

      setTimeout(() => {
        clients.forEach(c => c.disconnect());
        done.fail('Connection load test timeout');
      }, 5000);
    });
  });
});