import { EventEmitter } from "node:events";
import { AudioFrame } from "../types/events";

const FRAME_INTERVAL_MS = 220;

export class AudioGateway extends EventEmitter {
  ingestMockUtterance(streamId: string, utterance: string, baseTsMs = Date.now()): void {
    const tokens = utterance
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);

    tokens.forEach((token, idx) => {
      const frame: AudioFrame = {
        streamId,
        tsMs: baseTsMs + idx * FRAME_INTERVAL_MS,
        mockTranscript: token,
        speechProbability: 0.98
      };
      this.emit("frame", frame);
    });
  }
}

