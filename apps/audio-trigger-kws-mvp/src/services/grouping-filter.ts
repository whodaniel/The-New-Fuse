import { EventEmitter } from "node:events";
import { HitEvent } from '../types/events';

export class GroupingFilter extends EventEmitter {
  push(hit: HitEvent): void {
    this.emit("grouped_hit", hit);
  }
}

