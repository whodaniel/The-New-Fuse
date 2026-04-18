import { EventEmitter } from "node:events";
import { AudioFrame } from '../types/events.js';

export class VadGate extends EventEmitter {
  constructor(private readonly minSpeechProbability = 0.5) {
    super();
  }

  push(frame: AudioFrame): void {
    const speechProbability = frame.speechProbability ?? 1;
    if (speechProbability < this.minSpeechProbability) {
      return;
    }
    this.emit("speech_frame", frame);
  }
}

