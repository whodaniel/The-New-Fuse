/**
 * DrizzleChatRepository Integration Tests
 * Tests all 24 methods of the chat repository
 */

import { drizzleAgentRepository } from '../../src/drizzle/repositories/agent.repository';
import { drizzleChatRepository } from '../../src/drizzle/repositories/chat.repository';
import { drizzleUserRepository } from '../../src/drizzle/repositories/user.repository';
import {
  expectArrayLength,
  expectDatabaseRow,
  expectEmptyArray,
  expectNonEmptyArray,
  expectNotDeleted,
  expectNotNull,
  expectSoftDeleted,
  expectTimestampInFuture,
} from '../utils/assertions';
import { futureTimestamp, pastTimestamp, sleep } from '../utils/database-helpers';
import { AgentFactory, ChatFactory, MessageFactory, UserFactory } from '../utils/factories';

describe('DrizzleChatRepository', () => {
  let testUserId: string;
  let testAgentId: string;

  beforeEach(async () => {
    // Create test user and agent
    const userData = await UserFactory.build();
    const user = await drizzleUserRepository.create(userData);
    testUserId = user.id;

    const agentData = AgentFactory.build({ userId: testUserId });
    const agent = await drizzleAgentRepository.create(agentData);
    testAgentId = agent.id;
  });

  describe('Chat Operations', () => {
    describe('createChat', () => {
      it('should create a new chat', async () => {
        const chatData = ChatFactory.build({ userId: testUserId, agentId: testAgentId });

        const chat = await drizzleChatRepository.createChat(chatData);

        expectDatabaseRow(chat, {
          userId: testUserId,
          agentId: testAgentId,
          title: chatData.title,
        });
        expectNotDeleted(chat);
      });

      it('should create chat without agent', async () => {
        const chatData = ChatFactory.build({ userId: testUserId, agentId: null });

        const chat = await drizzleChatRepository.createChat(chatData);

        expect(chat.userId).toBe(testUserId);
        expect(chat.agentId).toBeNull();
      });
    });

    describe('findChatById', () => {
      it('should find chat by ID', async () => {
        const chatData = ChatFactory.build({ userId: testUserId });
        const created = await drizzleChatRepository.createChat(chatData);

        const found = await drizzleChatRepository.findChatById(created.id);

        expectNotNull(found);
        expect(found.id).toBe(created.id);
      });

      it('should return null for non-existent chat', async () => {
        const found = await drizzleChatRepository.findChatById('non-existent-id');

        expect(found).toBeNull();
      });

      it('should not return soft-deleted chats', async () => {
        const chatData = ChatFactory.build({ userId: testUserId });
        const created = await drizzleChatRepository.createChat(chatData);
        await drizzleChatRepository.softDeleteChat(created.id);

        const found = await drizzleChatRepository.findChatById(created.id);

        expectSoftDeleted(found);
      });
    });

    describe('findChatsByUserId', () => {
      it('should find all chats for a user', async () => {
        const chats = ChatFactory.buildList(3, { userId: testUserId });
        await Promise.all(chats.map((c) => drizzleChatRepository.createChat(c)));

        const found = await drizzleChatRepository.findChatsByUserId(testUserId);

        expectArrayLength(found, 3);
        expect(found.every((c) => c.userId === testUserId)).toBe(true);
      });

      it('should return empty array when user has no chats', async () => {
        const found = await drizzleChatRepository.findChatsByUserId('user-with-no-chats');

        expectEmptyArray(found);
      });

      it('should order chats by most recently updated', async () => {
        const chat1 = await drizzleChatRepository.createChat(
          ChatFactory.build({ userId: testUserId })
        );
        await sleep(10);
        const chat2 = await drizzleChatRepository.createChat(
          ChatFactory.build({ userId: testUserId })
        );

        const found = await drizzleChatRepository.findChatsByUserId(testUserId);

        expect(found[0].id).toBe(chat2.id); // Most recent first
      });
    });

    describe('findChatsByAgentId', () => {
      it('should find all chats for an agent', async () => {
        await drizzleChatRepository.createChat(
          ChatFactory.build({ userId: testUserId, agentId: testAgentId })
        );
        await drizzleChatRepository.createChat(
          ChatFactory.build({ userId: testUserId, agentId: testAgentId })
        );

        const found = await drizzleChatRepository.findChatsByAgentId(testAgentId);

        expectArrayLength(found, 2);
        expect(found.every((c) => c.agentId === testAgentId)).toBe(true);
      });

      it('should return empty array when agent has no chats', async () => {
        const found = await drizzleChatRepository.findChatsByAgentId('agent-with-no-chats');

        expectEmptyArray(found);
      });
    });

    describe('updateChat', () => {
      it('should update chat fields', async () => {
        const created = await drizzleChatRepository.createChat(
          ChatFactory.build({ userId: testUserId })
        );

        const updated = await drizzleChatRepository.updateChat(created.id, {
          title: 'Updated Title',
          metadata: { updated: true },
        });

        expectNotNull(updated);
        expect(updated.title).toBe('Updated Title');
        expect(updated.metadata).toEqual({ updated: true });
        expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
      });

      it('should return null for non-existent chat', async () => {
        const updated = await drizzleChatRepository.updateChat('non-existent-id', { title: 'New' });

        expect(updated).toBeNull();
      });
    });

    describe('softDeleteChat', () => {
      it('should soft delete chat', async () => {
        const created = await drizzleChatRepository.createChat(
          ChatFactory.build({ userId: testUserId })
        );

        const deleted = await drizzleChatRepository.softDeleteChat(created.id);

        expect(deleted).toBe(true);
        const found = await drizzleChatRepository.findChatById(created.id);
        expectSoftDeleted(found);
      });

      it('should return false for non-existent chat', async () => {
        const deleted = await drizzleChatRepository.softDeleteChat('non-existent-id');

        expect(deleted).toBe(false);
      });
    });
  });

  describe('Message Operations', () => {
    let testChatId: string;

    beforeEach(async () => {
      const chat = await drizzleChatRepository.createChat(
        ChatFactory.build({ userId: testUserId })
      );
      testChatId = chat.id;
    });

    describe('createMessage', () => {
      it('should create a new message', async () => {
        const messageData = MessageFactory.build({ chatId: testChatId });

        const message = await drizzleChatRepository.createMessage(messageData);

        expectDatabaseRow(message, {
          chatId: testChatId,
          role: messageData.role,
          content: messageData.content,
        });
        expect(message.isDeleted).toBe(false);
        expect(message.isEdited).toBe(false);
      });

      it('should create ephemeral message with expiry', async () => {
        const expiresAt = futureTimestamp(3600);
        const messageData = MessageFactory.build({
          chatId: testChatId,
          isEphemeral: true,
          expiresAt,
        });

        const message = await drizzleChatRepository.createMessage(messageData);

        expect(message.isEphemeral).toBe(true);
        expectTimestampInFuture(message.expiresAt!);
      });
    });

    describe('findMessageById', () => {
      it('should find message by ID', async () => {
        const messageData = MessageFactory.build({ chatId: testChatId });
        const created = await drizzleChatRepository.createMessage(messageData);

        const found = await drizzleChatRepository.findMessageById(created.id);

        expectNotNull(found);
        expect(found.id).toBe(created.id);
      });

      it('should return null for non-existent message', async () => {
        const found = await drizzleChatRepository.findMessageById('non-existent-id');

        expect(found).toBeNull();
      });

      it('should not return deleted messages', async () => {
        const messageData = MessageFactory.build({ chatId: testChatId });
        const created = await drizzleChatRepository.createMessage(messageData);
        await drizzleChatRepository.softDeleteMessage(created.id);

        const found = await drizzleChatRepository.findMessageById(created.id);

        expectSoftDeleted(found);
      });
    });

    describe('findMessagesByChatId', () => {
      it('should find all messages in a chat', async () => {
        const messages = MessageFactory.buildList(5, { chatId: testChatId });
        await Promise.all(messages.map((m) => drizzleChatRepository.createMessage(m)));

        const found = await drizzleChatRepository.findMessagesByChatId(testChatId);

        expectArrayLength(found, 5);
        expect(found.every((m) => m.chatId === testChatId)).toBe(true);
      });

      it('should limit messages to specified count', async () => {
        const messages = MessageFactory.buildList(10, { chatId: testChatId });
        await Promise.all(messages.map((m) => drizzleChatRepository.createMessage(m)));

        const found = await drizzleChatRepository.findMessagesByChatId(testChatId, 5);

        expectArrayLength(found, 5);
      });

      it('should return empty array when chat has no messages', async () => {
        const found = await drizzleChatRepository.findMessagesByChatId('empty-chat-id');

        expectEmptyArray(found);
      });

      it('should order messages by timestamp descending', async () => {
        const msg1 = await drizzleChatRepository.createMessage(
          MessageFactory.build({ chatId: testChatId })
        );
        await sleep(10);
        const msg2 = await drizzleChatRepository.createMessage(
          MessageFactory.build({ chatId: testChatId })
        );

        const found = await drizzleChatRepository.findMessagesByChatId(testChatId);

        expect(found[0].id).toBe(msg2.id); // Most recent first
      });
    });

    describe('updateMessage', () => {
      it('should update message content and mark as edited', async () => {
        const messageData = MessageFactory.build({ chatId: testChatId });
        const created = await drizzleChatRepository.createMessage(messageData);

        const updated = await drizzleChatRepository.updateMessage(created.id, 'Updated content');

        expectNotNull(updated);
        expect(updated.content).toBe('Updated content');
        expect(updated.isEdited).toBe(true);
        expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
      });

      it('should return null for non-existent message', async () => {
        const updated = await drizzleChatRepository.updateMessage('non-existent-id', 'New content');

        expect(updated).toBeNull();
      });
    });

    describe('softDeleteMessage', () => {
      it('should soft delete message', async () => {
        const messageData = MessageFactory.build({ chatId: testChatId });
        const created = await drizzleChatRepository.createMessage(messageData);

        const deleted = await drizzleChatRepository.softDeleteMessage(created.id);

        expect(deleted).toBe(true);
        const found = await drizzleChatRepository.findMessageById(created.id);
        expectSoftDeleted(found);
      });

      it('should return false for non-existent message', async () => {
        const deleted = await drizzleChatRepository.softDeleteMessage('non-existent-id');

        expect(deleted).toBe(false);
      });
    });

    describe('deleteExpiredMessages', () => {
      it('should delete expired ephemeral messages', async () => {
        const expiredTime = pastTimestamp(3600);
        const validTime = futureTimestamp(3600);

        // Create expired message
        await drizzleChatRepository.createMessage(
          MessageFactory.build({ chatId: testChatId, isEphemeral: true, expiresAt: expiredTime })
        );
        // Create valid message
        const valid = await drizzleChatRepository.createMessage(
          MessageFactory.build({ chatId: testChatId, isEphemeral: true, expiresAt: validTime })
        );

        const deletedCount = await drizzleChatRepository.deleteExpiredMessages();

        expect(deletedCount).toBe(1);

        // Valid message should still exist
        const found = await drizzleChatRepository.findMessageById(valid.id);
        expectNotNull(found);
      });

      it('should return 0 when no expired messages exist', async () => {
        const deletedCount = await drizzleChatRepository.deleteExpiredMessages();

        expect(deletedCount).toBe(0);
      });
    });

    describe('countMessagesInChat', () => {
      it('should count messages in chat', async () => {
        const messages = MessageFactory.buildList(7, { chatId: testChatId });
        await Promise.all(messages.map((m) => drizzleChatRepository.createMessage(m)));

        const count = await drizzleChatRepository.countMessagesInChat(testChatId);

        expect(count).toBe(7);
      });

      it('should return 0 when chat has no messages', async () => {
        const count = await drizzleChatRepository.countMessagesInChat('empty-chat-id');

        expect(count).toBe(0);
      });

      it('should not count deleted messages', async () => {
        const msg1 = await drizzleChatRepository.createMessage(
          MessageFactory.build({ chatId: testChatId })
        );
        await drizzleChatRepository.createMessage(MessageFactory.build({ chatId: testChatId }));
        await drizzleChatRepository.softDeleteMessage(msg1.id);

        const count = await drizzleChatRepository.countMessagesInChat(testChatId);

        expect(count).toBe(1);
      });
    });
  });

  describe('Chat Room Operations', () => {
    describe('createRoom', () => {
      it('should create a new chat room', async () => {
        const room = await drizzleChatRepository.createRoom({
          name: 'Test Room',
          ownerId: testUserId,
          isActive: true,
          participants: [testUserId],
          metadata: {},
        });

        expectDatabaseRow(room, {
          name: 'Test Room',
          ownerId: testUserId,
          isActive: true,
        });
        expect(room.participants).toEqual([testUserId]);
      });

      it('should create room with multiple participants', async () => {
        const userData2 = await UserFactory.build();
        const user2 = await drizzleUserRepository.create(userData2);

        const room = await drizzleChatRepository.createRoom({
          name: 'Multi-User Room',
          ownerId: testUserId,
          isActive: true,
          participants: [testUserId, user2.id],
          metadata: {},
        });

        expectArrayLength(room.participants, 2);
      });
    });

    describe('findRoomById', () => {
      it('should find room by ID', async () => {
        const created = await drizzleChatRepository.createRoom({
          name: 'Test Room',
          ownerId: testUserId,
          isActive: true,
          participants: [testUserId],
          metadata: {},
        });

        const found = await drizzleChatRepository.findRoomById(created.id);

        expectNotNull(found);
        expect(found.id).toBe(created.id);
      });

      it('should return null for non-existent room', async () => {
        const found = await drizzleChatRepository.findRoomById('non-existent-id');

        expect(found).toBeNull();
      });

      it('should not return soft-deleted rooms', async () => {
        const created = await drizzleChatRepository.createRoom({
          name: 'Test Room',
          ownerId: testUserId,
          isActive: true,
          participants: [testUserId],
          metadata: {},
        });
        await drizzleChatRepository.softDeleteRoom(created.id);

        const found = await drizzleChatRepository.findRoomById(created.id);

        expectSoftDeleted(found);
      });
    });

    describe('findRoomsByOwnerId', () => {
      it('should find all rooms owned by user', async () => {
        await drizzleChatRepository.createRoom({
          name: 'Room 1',
          ownerId: testUserId,
          isActive: true,
          participants: [testUserId],
          metadata: {},
        });
        await drizzleChatRepository.createRoom({
          name: 'Room 2',
          ownerId: testUserId,
          isActive: true,
          participants: [testUserId],
          metadata: {},
        });

        const found = await drizzleChatRepository.findRoomsByOwnerId(testUserId);

        expectArrayLength(found, 2);
        expect(found.every((r) => r.ownerId === testUserId)).toBe(true);
      });

      it('should return empty array when user owns no rooms', async () => {
        const found = await drizzleChatRepository.findRoomsByOwnerId('user-with-no-rooms');

        expectEmptyArray(found);
      });
    });

    describe('findActiveRooms', () => {
      it('should find all active rooms', async () => {
        await drizzleChatRepository.createRoom({
          name: 'Active Room',
          ownerId: testUserId,
          isActive: true,
          participants: [testUserId],
          metadata: {},
        });
        await drizzleChatRepository.createRoom({
          name: 'Inactive Room',
          ownerId: testUserId,
          isActive: false,
          participants: [testUserId],
          metadata: {},
        });

        const found = await drizzleChatRepository.findActiveRooms();

        expectNonEmptyArray(found);
        expect(found.every((r) => r.isActive === true)).toBe(true);
      });
    });

    describe('updateRoom', () => {
      it('should update room fields', async () => {
        const created = await drizzleChatRepository.createRoom({
          name: 'Original Name',
          ownerId: testUserId,
          isActive: true,
          participants: [testUserId],
          metadata: {},
        });

        const updated = await drizzleChatRepository.updateRoom(created.id, {
          name: 'Updated Name',
          isActive: false,
        });

        expectNotNull(updated);
        expect(updated.name).toBe('Updated Name');
        expect(updated.isActive).toBe(false);
      });

      it('should return null for non-existent room', async () => {
        const updated = await drizzleChatRepository.updateRoom('non-existent-id', { name: 'New' });

        expect(updated).toBeNull();
      });
    });

    describe('updateRoomLastMessage', () => {
      it('should update room last message timestamp', async () => {
        const created = await drizzleChatRepository.createRoom({
          name: 'Test Room',
          ownerId: testUserId,
          isActive: true,
          participants: [testUserId],
          metadata: {},
        });

        const beforeUpdate = new Date();
        await sleep(10);
        await drizzleChatRepository.updateRoomLastMessage(created.id);

        const updated = await drizzleChatRepository.findRoomById(created.id);
        expectNotNull(updated);
        expect(updated.lastMessageAt!.getTime()).toBeGreaterThan(beforeUpdate.getTime());
      });
    });

    describe('softDeleteRoom', () => {
      it('should soft delete room and mark as inactive', async () => {
        const created = await drizzleChatRepository.createRoom({
          name: 'Test Room',
          ownerId: testUserId,
          isActive: true,
          participants: [testUserId],
          metadata: {},
        });

        const deleted = await drizzleChatRepository.softDeleteRoom(created.id);

        expect(deleted).toBe(true);
        const found = await drizzleChatRepository.findRoomById(created.id);
        expectSoftDeleted(found);
      });
    });

    describe('findMessagesByRoomId', () => {
      let testRoomId: string;

      beforeEach(async () => {
        const room = await drizzleChatRepository.createRoom({
          name: 'Test Room',
          ownerId: testUserId,
          isActive: true,
          participants: [testUserId],
          metadata: {},
        });
        testRoomId = room.id;
      });

      it('should find messages in a room', async () => {
        const messages = MessageFactory.buildList(3, { roomId: testRoomId, chatId: undefined });
        await Promise.all(messages.map((m) => drizzleChatRepository.createMessage(m)));

        const found = await drizzleChatRepository.findMessagesByRoomId(testRoomId);

        expectArrayLength(found, 3);
        expect(found.every((m) => m.roomId === testRoomId)).toBe(true);
      });

      it('should limit messages to specified count', async () => {
        const messages = MessageFactory.buildList(10, { roomId: testRoomId, chatId: undefined });
        await Promise.all(messages.map((m) => drizzleChatRepository.createMessage(m)));

        const found = await drizzleChatRepository.findMessagesByRoomId(testRoomId, 5);

        expectArrayLength(found, 5);
      });
    });

    describe('countMessagesInRoom', () => {
      let testRoomId: string;

      beforeEach(async () => {
        const room = await drizzleChatRepository.createRoom({
          name: 'Test Room',
          ownerId: testUserId,
          isActive: true,
          participants: [testUserId],
          metadata: {},
        });
        testRoomId = room.id;
      });

      it('should count messages in room', async () => {
        const messages = MessageFactory.buildList(5, { roomId: testRoomId, chatId: undefined });
        await Promise.all(messages.map((m) => drizzleChatRepository.createMessage(m)));

        const count = await drizzleChatRepository.countMessagesInRoom(testRoomId);

        expect(count).toBe(5);
      });

      it('should return 0 when room has no messages', async () => {
        const count = await drizzleChatRepository.countMessagesInRoom('empty-room-id');

        expect(count).toBe(0);
      });
    });
  });

  describe('Ephemeral Chat Messages', () => {
    describe('createChatMessage', () => {
      it('should create ephemeral chat message', async () => {
        const expiresAt = futureTimestamp(604800); // 7 days
        const message = await drizzleChatRepository.createChatMessage({
          userId: testUserId,
          content: 'Ephemeral message',
          messageType: 'chat',
          expiresAt,
          metadata: {},
        });

        expect(message.userId).toBe(testUserId);
        expect(message.content).toBe('Ephemeral message');
        expectTimestampInFuture(message.expiresAt);
      });
    });

    describe('findChatMessagesByUserId', () => {
      it('should find non-expired chat messages for user', async () => {
        const validTime = futureTimestamp(604800);
        await drizzleChatRepository.createChatMessage({
          userId: testUserId,
          content: 'Message 1',
          messageType: 'chat',
          expiresAt: validTime,
          metadata: {},
        });
        await drizzleChatRepository.createChatMessage({
          userId: testUserId,
          content: 'Message 2',
          messageType: 'chat',
          expiresAt: validTime,
          metadata: {},
        });

        const found = await drizzleChatRepository.findChatMessagesByUserId(testUserId);

        expectArrayLength(found, 2);
        expect(found.every((m) => m.userId === testUserId)).toBe(true);
      });

      it('should not return expired messages', async () => {
        const expiredTime = pastTimestamp(3600);
        await drizzleChatRepository.createChatMessage({
          userId: testUserId,
          content: 'Expired message',
          messageType: 'chat',
          expiresAt: expiredTime,
          metadata: {},
        });

        const found = await drizzleChatRepository.findChatMessagesByUserId(testUserId);

        expectEmptyArray(found);
      });

      it('should limit results', async () => {
        const validTime = futureTimestamp(604800);
        const messages = Array.from({ length: 10 }, (_, i) => ({
          userId: testUserId,
          content: `Message ${i}`,
          messageType: 'chat' as const,
          expiresAt: validTime,
          metadata: {},
        }));
        await Promise.all(messages.map((m) => drizzleChatRepository.createChatMessage(m)));

        const found = await drizzleChatRepository.findChatMessagesByUserId(testUserId, 5);

        expectArrayLength(found, 5);
      });
    });

    describe('deleteExpiredChatMessages', () => {
      it('should delete expired chat messages', async () => {
        const expiredTime = pastTimestamp(3600);
        const validTime = futureTimestamp(604800);

        await drizzleChatRepository.createChatMessage({
          userId: testUserId,
          content: 'Expired',
          messageType: 'chat',
          expiresAt: expiredTime,
          metadata: {},
        });
        const valid = await drizzleChatRepository.createChatMessage({
          userId: testUserId,
          content: 'Valid',
          messageType: 'chat',
          expiresAt: validTime,
          metadata: {},
        });

        const deletedCount = await drizzleChatRepository.deleteExpiredChatMessages();

        expect(deletedCount).toBe(1);

        // Valid message should still exist
        const found = await drizzleChatRepository.findChatMessagesByUserId(testUserId);
        expectArrayLength(found, 1);
        expect(found[0].id).toBe(valid.id);
      });

      it('should return 0 when no expired messages exist', async () => {
        const deletedCount = await drizzleChatRepository.deleteExpiredChatMessages();

        expect(deletedCount).toBe(0);
      });
    });
  });

  describe('Chat Room Participant Operations', () => {
    let testRoomId: string;

    beforeEach(async () => {
      const roomData = {
        name: 'Test Room',
        ownerId: testUserId,
        isPrivate: false,
        metadata: {},
      };
      const room = await drizzleChatRepository.createRoom(roomData);
      testRoomId = room.id;
    });

    describe('addParticipant', () => {
      it('should add participant to room', async () => {
        const participantData = {
          roomId: testRoomId,
          userId: testUserId,
          role: 'MEMBER' as const,
        };

        const participant = await drizzleChatRepository.addParticipant(participantData);

        expectDatabaseRow(participant, {
          roomId: testRoomId,
          userId: testUserId,
          role: 'MEMBER',
        });
      });

      it('should add participant with admin role', async () => {
        const participantData = {
          roomId: testRoomId,
          userId: testUserId,
          role: 'ADMIN' as const,
        };

        const participant = await drizzleChatRepository.addParticipant(participantData);

        expect(participant.role).toBe('ADMIN');
      });
    });

    describe('findParticipantsByRoomId', () => {
      it('should find all participants in room', async () => {
        const user2Data = await UserFactory.build();
        const user2 = await drizzleUserRepository.create(user2Data);

        await drizzleChatRepository.addParticipant({
          roomId: testRoomId,
          userId: testUserId,
          role: 'ADMIN' as const,
        });
        await drizzleChatRepository.addParticipant({
          roomId: testRoomId,
          userId: user2.id,
          role: 'MEMBER' as const,
        });

        const participants = await drizzleChatRepository.findParticipantsByRoomId(testRoomId);

        expectArrayLength(participants, 2);
        expect(participants.every((p) => p.roomId === testRoomId)).toBe(true);
      });

      it('should return empty array for room with no participants', async () => {
        const participants =
          await drizzleChatRepository.findParticipantsByRoomId('non-existent-room');

        expect(participants).toEqual([]);
      });
    });

    describe('findParticipant', () => {
      it('should find specific participant', async () => {
        await drizzleChatRepository.addParticipant({
          roomId: testRoomId,
          userId: testUserId,
          role: 'MEMBER' as const,
        });

        const participant = await drizzleChatRepository.findParticipant(testRoomId, testUserId);

        expectNotNull(participant);
        expect(participant.roomId).toBe(testRoomId);
        expect(participant.userId).toBe(testUserId);
      });

      it('should return null for non-existent participant', async () => {
        const participant = await drizzleChatRepository.findParticipant(
          testRoomId,
          'non-existent-user'
        );

        expect(participant).toBeNull();
      });
    });

    describe('updateParticipant', () => {
      it('should update participant role', async () => {
        await drizzleChatRepository.addParticipant({
          roomId: testRoomId,
          userId: testUserId,
          role: 'MEMBER' as const,
        });

        const updated = await drizzleChatRepository.updateParticipant(testRoomId, testUserId, {
          role: 'ADMIN' as const,
        });

        expectNotNull(updated);
        expect(updated.role).toBe('ADMIN');
      });

      it('should return null for non-existent participant', async () => {
        const updated = await drizzleChatRepository.updateParticipant(
          testRoomId,
          'non-existent-user',
          {
            role: 'ADMIN' as const,
          }
        );

        expect(updated).toBeNull();
      });
    });

    describe('removeParticipant', () => {
      it('should remove participant from room', async () => {
        await drizzleChatRepository.addParticipant({
          roomId: testRoomId,
          userId: testUserId,
          role: 'MEMBER' as const,
        });

        const result = await drizzleChatRepository.removeParticipant(testRoomId, testUserId);

        expect(result).toBe(true);

        const participant = await drizzleChatRepository.findParticipant(testRoomId, testUserId);
        expect(participant).toBeNull();
      });

      it('should return false for non-existent participant', async () => {
        const result = await drizzleChatRepository.removeParticipant(
          testRoomId,
          'non-existent-user'
        );

        expect(result).toBe(false);
      });
    });

    describe('findJoinedRooms', () => {
      it('should find all rooms user has joined', async () => {
        const room1Data = {
          name: 'Room 1',
          ownerId: testUserId,
          isPrivate: false,
          metadata: {},
        };
        const room2Data = {
          name: 'Room 2',
          ownerId: testUserId,
          isPrivate: false,
          metadata: {},
        };

        const room1 = await drizzleChatRepository.createRoom(room1Data);
        const room2 = await drizzleChatRepository.createRoom(room2Data);

        await drizzleChatRepository.addParticipant({
          roomId: room1.id,
          userId: testUserId,
          role: 'MEMBER' as const,
        });
        await drizzleChatRepository.addParticipant({
          roomId: room2.id,
          userId: testUserId,
          role: 'MEMBER' as const,
        });

        const rooms = await drizzleChatRepository.findJoinedRooms(testUserId);

        expect(rooms.length).toBeGreaterThanOrEqual(2);
        expect(rooms.some((r) => r.id === room1.id)).toBe(true);
        expect(rooms.some((r) => r.id === room2.id)).toBe(true);
      });

      it('should return empty array for user not in any rooms', async () => {
        const user2Data = await UserFactory.build();
        const user2 = await drizzleUserRepository.create(user2Data);

        const rooms = await drizzleChatRepository.findJoinedRooms(user2.id);

        expect(rooms).toEqual([]);
      });

      it('should not return soft-deleted rooms', async () => {
        const roomData = {
          name: 'Deleted Room',
          ownerId: testUserId,
          isPrivate: false,
          metadata: {},
        };
        const room = await drizzleChatRepository.createRoom(roomData);

        await drizzleChatRepository.addParticipant({
          roomId: room.id,
          userId: testUserId,
          role: 'MEMBER' as const,
        });

        await drizzleChatRepository.softDeleteRoom(room.id);

        const rooms = await drizzleChatRepository.findJoinedRooms(testUserId);

        expect(rooms.every((r) => r.id !== room.id)).toBe(true);
      });
    });
  });

  describe('Read Receipt Operations', () => {
    let testChatId: string;
    let testMessageId: string;

    beforeEach(async () => {
      const chatData = ChatFactory.build({ userId: testUserId });
      const chat = await drizzleChatRepository.createChat(chatData);
      testChatId = chat.id;

      const messageData = MessageFactory.build({ chatId: testChatId });
      const message = await drizzleChatRepository.createMessage(messageData);
      testMessageId = message.id;
    });

    describe('upsertReadReceipt', () => {
      it('should create new read receipt', async () => {
        const receiptData = {
          messageId: testMessageId,
          userId: testUserId,
          readAt: new Date(),
        };

        const receipt = await drizzleChatRepository.upsertReadReceipt(receiptData);

        expectDatabaseRow(receipt, {
          messageId: testMessageId,
          userId: testUserId,
        });
        expect(receipt.readAt).toBeInstanceOf(Date);
      });

      it('should update existing read receipt', async () => {
        const receiptData = {
          messageId: testMessageId,
          userId: testUserId,
          readAt: new Date('2024-01-01'),
        };

        const first = await drizzleChatRepository.upsertReadReceipt(receiptData);
        const firstReadAt = first.readAt;

        // Small delay to ensure different timestamp
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Upsert again - should update existing
        const second = await drizzleChatRepository.upsertReadReceipt({
          messageId: testMessageId,
          userId: testUserId,
          readAt: new Date(),
        });

        expect(second.id).toBe(first.id); // Same record
        expect(second.readAt.getTime()).toBeGreaterThan(firstReadAt.getTime()); // Updated timestamp
      });

      it('should create separate receipts for different users', async () => {
        const user2Data = await UserFactory.build();
        const user2 = await drizzleUserRepository.create(user2Data);

        const receipt1 = await drizzleChatRepository.upsertReadReceipt({
          messageId: testMessageId,
          userId: testUserId,
          readAt: new Date(),
        });

        const receipt2 = await drizzleChatRepository.upsertReadReceipt({
          messageId: testMessageId,
          userId: user2.id,
          readAt: new Date(),
        });

        expect(receipt1.id).not.toBe(receipt2.id);
        expect(receipt1.userId).toBe(testUserId);
        expect(receipt2.userId).toBe(user2.id);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle chats with null metadata', async () => {
      const chat = await drizzleChatRepository.createChat(
        ChatFactory.build({ userId: testUserId, metadata: null })
      );

      expect(chat.metadata).toBeNull();
    });

    it('should handle messages with very long content', async () => {
      const chat = await drizzleChatRepository.createChat(
        ChatFactory.build({ userId: testUserId })
      );
      const longContent = 'A'.repeat(10000);

      const message = await drizzleChatRepository.createMessage(
        MessageFactory.build({ chatId: chat.id, content: longContent })
      );

      expect(message.content).toBe(longContent);
    });

    it('should handle concurrent message creates', async () => {
      const chat = await drizzleChatRepository.createChat(
        ChatFactory.build({ userId: testUserId })
      );
      const messages = MessageFactory.buildList(10, { chatId: chat.id });

      const created = await Promise.all(
        messages.map((m) => drizzleChatRepository.createMessage(m))
      );

      expectArrayLength(created, 10);
      const uniqueIds = new Set(created.map((m) => m.id));
      expect(uniqueIds.size).toBe(10);
    });
  });
});
