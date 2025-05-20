/**
 * Tests for the WebSocketCommunicationProtocol
 * 
 * These tests validate the basic functionality of the WebSocket-based
 * communication protocol implementation.
 */

import { WebSocketCommunicationProtocol } from '../protocols/WebSocketCommunicationProtocol.js';
import { Message } from '../protocols/ICommunicationProtocol.js';

// Mock WebSocket as it's not available in Node.js environment
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public onopen: (() => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public onclose: ((event: { code: number, reason: string }) => void) | null = null;
  public onerror: ((error: any) => void) | null = null;
  public readyState: number = MockWebSocket.CONNECTING;
  private sentMessages: any[] = [];

  constructor(public url: string) {
    // Simulate connection delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 50);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(JSON.parse(data));
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose({ code: 1000, reason: 'Normal closure' });
  }

  // Test helpers
  triggerMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  triggerError(error: any): void {
    if (this.onerror) {
      this.onerror(error);
    }
  }

  getSentMessages(): any[] {
    return this.sentMessages;
  }
}

// Assign the mock to global WebSocket
global.WebSocket = MockWebSocket as any;

describe('WebSocketCommunicationProtocol', () => {
  let senderProtocol: WebSocketCommunicationProtocol;
  let receiverProtocol: WebSocketCommunicationProtocol;
  let mockSenderSocket: MockWebSocket;
  let mockReceiverSocket: MockWebSocket;
  
  beforeEach(async () => {
    // Create sender protocol
    senderProtocol = new WebSocketCommunicationProtocol({
      agentId: 'sender',
      serverUrl: 'ws://localhost:8080/test',
      debug: true
    });
    
    // Create receiver protocol
    receiverProtocol = new WebSocketCommunicationProtocol({
      agentId: 'receiver',
      serverUrl: 'ws://localhost:8080/test',
      debug: true
    });
    
    // Initialize protocols
    await senderProtocol.initialize();
    await receiverProtocol.initialize();
    
    // Store WebSocket mocks for testing
    senderProtocol.startListening();
    receiverProtocol.startListening();
    
    // Get the mock WebSocket instances
    // Need to access private property for testing
    mockSenderSocket = (senderProtocol as any).socket;
    mockReceiverSocket = (receiverProtocol as any).socket;
    
    // Wait for connections to establish
    await new Promise(resolve => setTimeout(resolve, 100));
  });
  
  afterEach(() => {
    // Stop listening and clean up
    senderProtocol.stopListening();
    receiverProtocol.stopListening();
  });
  
  test('should connect to WebSocket server', () => {
    expect(mockSenderSocket.readyState).toBe(MockWebSocket.OPEN);
    expect(mockReceiverSocket.readyState).toBe(MockWebSocket.OPEN);
  });
  
  test('should send registration message on connect', () => {
    const messages = mockSenderSocket.getSentMessages();
    const registrationMessage = messages.find(m => m.type === 'register');
    
    expect(registrationMessage).toBeDefined();
    expect(registrationMessage.source).toBe('sender');
  });
  
  test('should send and process messages', done => {
    // Create a handler for the receiver
    receiverProtocol.onMessageReceived((message: Message) => {
      expect(message.source).toBe('sender');
      expect(message.target).toBe('receiver');
      expect(message.content).toBe('Hello, WebSocket!');
      expect(message.metadata.type).toBe('text');
      done();
    });
    
    // Send a message (this will go to the mock)
    senderProtocol.sendMessage('receiver', 'Hello, WebSocket!', 'text');
    
    // Get the sent message from the mock
    const sentMessages = mockSenderSocket.getSentMessages();
    const message = sentMessages.find(m => m.metadata?.type === 'text');
    
    // Simulate message receipt on receiver's side
    mockReceiverSocket.triggerMessage(message);
  });
  
  test('should handle connection close and reconnect', done => {
    // Set up reconnect spy
    const reconnectSpy = jest.spyOn(senderProtocol as any, 'reconnect');
    
    // Close the connection
    mockSenderSocket.close();
    
    // Check that reconnect was called
    setTimeout(() => {
      expect(reconnectSpy).toHaveBeenCalled();
      done();
    }, 100);
  });
  
  test('should handle errors gracefully', done => {
    // Set up error handler
    senderProtocol.on('error', (error) => {
      expect(error).toBeDefined();
      done();
    });
    
    // Trigger an error
    mockSenderSocket.triggerError(new Error('Test error'));
  });
  
  test('should process system messages', done => {
    // Set up notification handler
    senderProtocol.on('notification', (content) => {
      expect(content).toBe('Test notification');
      done();
    });
    
    // Simulate system message
    mockSenderSocket.triggerMessage({
      type: 'system',
      subtype: 'notification',
      content: 'Test notification'
    });
  });
  
  test('should queue messages when disconnected', async () => {
    // Close the socket
    mockSenderSocket.close();
    
    // Send a message while disconnected
    const messagePromise = senderProtocol.sendMessage('receiver', 'Queued message', 'text');
    
    // Create a new mock socket (simulating reconnect)
    const newMockSocket = new MockWebSocket('ws://localhost:8080/test');
    (senderProtocol as any).socket = newMockSocket;
    
    // Trigger connected event
    if (newMockSocket.onopen) newMockSocket.onopen();
    
    // Wait a bit for queue processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check that message was sent after reconnection
    const sentMessages = newMockSocket.getSentMessages();
    const queuedMessage = sentMessages.find(m => 
      m.metadata?.type === 'text' && m.content === 'Queued message'
    );
    
    expect(queuedMessage).toBeDefined();
  });
});