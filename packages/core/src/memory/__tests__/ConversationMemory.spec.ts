import { jest } from '@jest/globals';
import { ConversationMemory, ConversationTurn } from '../ConversationMemory';
import { VectorMemoryStore } from '../VectorMemoryStore';
import { SearchResult } from '../MemoryTypes';

// Mock the VectorMemoryStore
jest.mock('../VectorMemoryStore');

const MockVectorMemoryStore = VectorMemoryStore as jest.MockedClass<typeof VectorMemoryStore>;

describe('ConversationMemory', () => {
  let conversationMemory: ConversationMemory;
  let mockVectorMemoryStore: jest.Mocked<VectorMemoryStore>;

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    MockVectorMemoryStore.mockClear();
    mockVectorMemoryStore = new MockVectorMemoryStore() as jest.Mocked<VectorMemoryStore>;
    conversationMemory = new ConversationMemory(mockVectorMemoryStore);
  });

  describe('storeConversationTurn', () => {
    it('should correctly format and store a conversation turn', async () => {
      const sessionId = 'session-1';
      const turn: ConversationTurn = {
        agentId: 'agent-1',
        timestamp: new Date('2023-01-01T12:00:00.000Z'),
        role: 'user',
        content: 'Hello, world!',
        importance: 0.9,
      };

      await conversationMemory.storeConversationTurn(sessionId, turn);

      expect(mockVectorMemoryStore.addItem).toHaveBeenCalledTimes(1);
      const [id, config, item] = mockVectorMemoryStore.addItem.mock.calls[0];

      expect(id).toBe('session-1-1672574400000');
      expect(config).toBeNull();
      expect(item).toEqual({
        id: 'session-1-1672574400000',
        content: 'Hello, world!',
        type: 'conversation',
        embedding: expect.any(Array),
        importance: 0.9,
        metadata: {
          sessionId: 'session-1',
          agentId: 'agent-1',
          timestamp: '2023-01-01T12:00:00.000Z',
          role: 'user',
        },
        timestamp: 1672574400000,
      });
    });
  });

  describe('getRelevantContext', () => {
    it('should filter by relevance, map results, and sort chronologically', async () => {
      const sessionId = 'session-2';
      const mockSearchResults: SearchResult[] = [
        {
          item: {
            id: '2',
            content: 'This is the second message.',
            type: 'conversation',
            embedding: [],
            importance: 0.8,
            metadata: {
              sessionId,
              agentId: 'agent-2',
              timestamp: '2023-01-01T12:01:00.000Z',
              role: 'agent',
            },
            timestamp: new Date('2023-01-01T12:01:00.000Z').getTime(),
          },
          similarity: 0.9,
        },
        {
          item: {
            id: '1',
            content: 'This is the first message.',
            type: 'conversation',
            embedding: [],
            importance: 0.7,
            metadata: {
              sessionId,
              agentId: 'agent-2',
              timestamp: '2023-01-01T12:00:00.000Z',
              role: 'user',
            },
            timestamp: new Date('2023-01-01T12:00:00.000Z').getTime(),
          },
          similarity: 0.8,
        },
        {
          item: {
            id: '3',
            content: 'This message is not relevant enough.',
            type: 'conversation',
            embedding: [],
            importance: 0.5,
            metadata: {
              sessionId,
              agentId: 'agent-2',
              timestamp: '2023-01-01T12:02:00.000Z',
              role: 'user',
            },
            timestamp: new Date('2023-01-01T12:02:00.000Z').getTime(),
          },
          similarity: 0.5, // Below the 0.6 threshold
        },
      ];

      mockVectorMemoryStore.findSimilarItems.mockResolvedValue(mockSearchResults);

      const context = await conversationMemory.getRelevantContext(sessionId, 'some query');

      expect(mockVectorMemoryStore.findSimilarItems).toHaveBeenCalledWith({
        text: 'some query',
        limit: 5,
        filters: { metadata: { sessionId } },
      });

      expect(context).toHaveLength(2);
      expect(context[0].content).toBe('This is the first message.');
      expect(context[1].content).toBe('This is the second message.');
      expect(context[0].importance).toBe(0.7);
      expect(context[1].importance).toBe(0.8);
    });
  });
});
