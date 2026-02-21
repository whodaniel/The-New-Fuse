/**
 * Tests for the FileCommunicationProtocol
 * 
 * These tests validate the basic functionality of the file-based
 * communication protocol implementation.
 */

import * as path from 'path';
import * as fs from 'fs';
import { FileCommunicationProtocol } from '../protocols/FileCommunicationProtocol.js';
import { Message } from '../protocols/ICommunicationProtocol.js';

// Test directory for message files
const TEST_DIR = path.join(process.cwd(), 'test-communication');

describe('FileCommunicationProtocol', () => {
  let senderProtocol: FileCommunicationProtocol;
  let receiverProtocol: FileCommunicationProtocol;
  
  beforeEach(async () => {
    // Clean up test directory if it exists
    if (fs.existsSync(TEST_DIR)) {
      const files = fs.readdirSync(TEST_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(TEST_DIR, file));
      }
      fs.rmdirSync(TEST_DIR);
    }
    
    // Create sender protocol
    senderProtocol = new FileCommunicationProtocol({
      agentId: 'sender',
      communicationDir: TEST_DIR,
      debug: true
    });
    
    // Create receiver protocol
    receiverProtocol = new FileCommunicationProtocol({
      agentId: 'receiver',
      communicationDir: TEST_DIR,
      debug: true
    });
    
    // Initialize protocols
    await senderProtocol.initialize();
    await receiverProtocol.initialize();
  });
  
  afterEach(() => {
    // Stop listening and clean up
    senderProtocol.stopListening();
    receiverProtocol.stopListening();
    
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      const files = fs.readdirSync(TEST_DIR);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(TEST_DIR, file));
        } catch (err) {
          console.warn(`Could not delete file ${file}:`, err);
        }
      }
      try {
        fs.rmdirSync(TEST_DIR);
      } catch (err) {
        console.warn(`Could not delete directory ${TEST_DIR}:`, err);
      }
    }
  });
  
  test('should initialize protocol', async () => {
    expect(fs.existsSync(TEST_DIR)).toBe(true);
  });
  
  test('should send and receive a message', done => {
    // Create a handler for the receiver
    receiverProtocol.onMessageReceived((message: Message) => {
      expect(message.source).toBe('sender');
      expect(message.target).toBe('receiver');
      expect(message.content).toBe('Hello, receiver!');
      expect(message.metadata.type).toBe('text');
      done();
    });
    
    // Start listening for messages
    receiverProtocol.startListening();
    
    // Send a message
    senderProtocol.sendMessage('receiver', 'Hello, receiver!', 'text');
  });
  
  test('should handle different message types correctly', done => {
    let messageCount = 0;
    
    // Register type-specific handler
    receiverProtocol.onMessageType('task', (message: Message) => {
      expect(message.metadata.type).toBe('task');
      expect(message.content.taskName).toBe('processData');
      messageCount++;
      if (messageCount === 2) done();
    });
    
    // Register another type-specific handler
    receiverProtocol.onMessageType('notification', (message: Message) => {
      expect(message.metadata.type).toBe('notification');
      expect(message.content.message).toBe('Task completed');
      messageCount++;
      if (messageCount === 2) done();
    });
    
    // Start listening for messages
    receiverProtocol.startListening();
    
    // Send messages of different types
    senderProtocol.sendMessage('receiver', { taskName: 'processData', data: [1, 2, 3] }, 'task');
    senderProtocol.sendMessage('receiver', { message: 'Task completed', status: 'success' }, 'notification');
  });
  
  test('should handle response to a message', done => {
    // Track the original message for response
    let originalMessage: Message;
    
    // Set up sender to receive response
    senderProtocol.onMessageReceived((message: Message) => {
      expect(message.source).toBe('receiver');
      expect(message.target).toBe('sender');
      expect(message.content).toBe('Message received!');
      expect(message.metadata.type).toBe('response');
      expect(message.metadata.conversationId).toBe(originalMessage.metadata.conversationId);
      done();
    });
    
    // Set up receiver to send response
    receiverProtocol.onMessageReceived((message: Message) => {
      // Send response back
      receiverProtocol.sendResponse(message, 'Message received!');
    });
    
    // Start listening
    senderProtocol.startListening();
    receiverProtocol.startListening();
    
    // Send the message
    senderProtocol.sendMessage('receiver', 'Hello, can you respond?', 'text').then(message => {
      originalMessage = message;
    });
  });
});