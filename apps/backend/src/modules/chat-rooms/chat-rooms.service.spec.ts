import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { drizzleChatRepository } from '@the-new-fuse/database';
import { ChatRoomsService } from './chat-rooms.service';
import { ChatRoomParticipantRole, MessageType } from './dto/chat-room.dto';

// Mock the drizzleChatRepository
jest.mock('@the-new-fuse/database', () => ({
  drizzleChatRepository: {
    createRoom: jest.fn(),
    addParticipant: jest.fn(),
    findRoomById: jest.fn(),
    findParticipantsByRoomId: jest.fn(),
    countMessagesInRoom: jest.fn(),
    findJoinedRooms: jest.fn(),
    updateRoom: jest.fn(),
    softDeleteRoom: jest.fn(),
    createMessage: jest.fn(),
    updateRoomLastMessage: jest.fn(),
    findMessagesByRoomId: jest.fn(),
    findMessageById: jest.fn(),
    updateMessage: jest.fn(),
    softDeleteMessage: jest.fn(),
    upsertReadReceipt: jest.fn(),
    updateParticipant: jest.fn(),
    removeParticipant: jest.fn(),
    findParticipant: jest.fn(),
  },
}));

describe('ChatRoomsService', () => {
  let service: ChatRoomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatRoomsService],
    }).compile();

    service = module.get<ChatRoomsService>(ChatRoomsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createChatRoom', () => {
    it('should create a room and add the owner as a participant', async () => {
      const createDto = {
        name: 'Test Room',
        description: 'Test Description',
        isPrivate: false,
      };
      const ownerId = 'user-1';
      const mockRoom = { id: 'room-1', ...createDto, ownerId, createdAt: new Date() };

      (drizzleChatRepository.createRoom as jest.Mock).mockResolvedValue(mockRoom);
      (drizzleChatRepository.addParticipant as jest.Mock).mockResolvedValue({ id: 'part-1' });

      const result = await service.createChatRoom(createDto as any, ownerId);

      expect(drizzleChatRepository.createRoom).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Room',
          ownerId,
        })
      );
      expect(drizzleChatRepository.addParticipant).toHaveBeenCalledWith(
        expect.objectContaining({
          roomId: 'room-1',
          userId: ownerId,
          role: ChatRoomParticipantRole.ADMIN,
        })
      );
      expect(result.id).toBe('room-1');
    });
  });

  describe('getChatRoom', () => {
    it('should return a formatted chat room with counts', async () => {
      const roomId = 'room-1';
      const userId = 'user-1';
      const mockRoom = { id: roomId, name: 'Room 1', ownerId: 'owner-1' };

      (drizzleChatRepository.findParticipant as jest.Mock).mockResolvedValue({ userId });
      (drizzleChatRepository.findRoomById as jest.Mock).mockResolvedValue(mockRoom);
      (drizzleChatRepository.findParticipantsByRoomId as jest.Mock).mockResolvedValue([
        { id: 'p1' },
        { id: 'p2' },
      ]);
      (drizzleChatRepository.countMessagesInRoom as jest.Mock).mockResolvedValue(10);

      const result = await service.getChatRoom(roomId, userId);

      expect(result.participantCount).toBe(2);
      expect(result.messageCount).toBe(10);
      expect(result.name).toBe('Room 1');
    });

    it('should throw NotFoundException if room not found', async () => {
      (drizzleChatRepository.findParticipant as jest.Mock).mockResolvedValue({ userId: 'u1' });
      (drizzleChatRepository.findRoomById as jest.Mock).mockResolvedValue(null);

      await expect(service.getChatRoom('invalid', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createMessage', () => {
    it('should create a message and update room last message', async () => {
      const roomId = 'room-1';
      const senderId = 'user-1';
      const createDto = { content: 'Hello', type: MessageType.TEXT };
      const mockMessage = {
        id: 'msg-1',
        content: 'Hello',
        senderId,
        roomId,
        timestamp: new Date(),
        metadata: { type: MessageType.TEXT },
      };

      (drizzleChatRepository.findParticipant as jest.Mock).mockResolvedValue({ userId: senderId });
      (drizzleChatRepository.createMessage as jest.Mock).mockResolvedValue(mockMessage);

      const result = await service.createMessage(roomId, createDto as any, senderId);

      expect(drizzleChatRepository.createMessage).toHaveBeenCalled();
      expect(drizzleChatRepository.updateRoomLastMessage).toHaveBeenCalledWith(roomId);
      expect(result.content).toBe('Hello');
    });
  });
});
