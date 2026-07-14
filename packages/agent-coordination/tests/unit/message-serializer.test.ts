import { MessageSerializer } from '../../src/serializers/message-serializer.js';
import { SerializationFormat } from '../../src/types/coordination.types.js';

describe('MessageSerializer', () => {
  describe('JSON format', () => {
    const serializer = new MessageSerializer(SerializationFormat.JSON);

    it('round-trips a nested object without loss', () => {
      const data = { agentId: 'agent-1', count: 42, nested: { ok: true, list: [1, 2, 3] } };
      const out = serializer.deserialize<typeof data>(serializer.serialize(data));
      expect(out).toEqual(data);
    });

    it('throws a descriptive error on malformed JSON', () => {
      expect(() => serializer.deserialize('{not valid json')).toThrow(/Failed to deserialize JSON/);
    });
  });

  describe('MSGPACK format', () => {
    const serializer = new MessageSerializer(SerializationFormat.MSGPACK);

    it('round-trips a nested object through base64', () => {
      const data = { hello: 'world', list: [1, 2, 3], flag: false };
      const encoded = serializer.serialize(data);
      expect(typeof encoded).toBe('string');
      expect(serializer.deserialize<typeof data>(encoded)).toEqual(data);
    });

    it('produces a different encoding than JSON for the same payload', () => {
      const data = { a: 1 };
      expect(serializer.serialize(data)).not.toBe(
        new MessageSerializer(SerializationFormat.JSON).serialize(data)
      );
    });
  });

  describe('format switching', () => {
    it('reflects the configured format and switches at runtime', () => {
      const serializer = new MessageSerializer(SerializationFormat.JSON);
      expect(serializer.getFormat()).toBe(SerializationFormat.JSON);
      serializer.setFormat(SerializationFormat.MSGPACK);
      expect(serializer.getFormat()).toBe(SerializationFormat.MSGPACK);
    });
  });

  describe('size + limits', () => {
    const serializer = new MessageSerializer(SerializationFormat.JSON);

    it('reports a positive byte size for non-empty data', () => {
      expect(serializer.size({ x: 1 })).toBeGreaterThan(0);
    });

    it('detects when data exceeds the configured byte limit', () => {
      const data = { x: 1 };
      expect(serializer.exceedsLimit(data, 1000)).toBe(false);
      expect(serializer.exceedsLimit(data, 1)).toBe(true);
    });
  });
});
