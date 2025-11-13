"use strict";
/**
 * Entity Event Store
 * Handles event sourcing for unified entities
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EntityEventStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityEventStore = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
let EntityEventStore = EntityEventStore_1 = class EntityEventStore {
    eventEmitter;
    logger = new common_1.Logger(EntityEventStore_1.name);
    events = new Map();
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    async saveEvent(event) {
        const entityEvents = this.events.get(event.entityId) || [];
        entityEvents.push(event);
        this.events.set(event.entityId, entityEvents);
        this.eventEmitter.emit(`entity.${event.type}, event);`, this.logger.debug(`Saved event ${event.type}`));
        for (entity; $; { event, : .entityId } `);
  }

  async getEvents(entityId: string): Promise<EntityEvent[]> {
    return this.events.get(entityId) || [];
  }

  async getEventsByType(type: string): Promise<EntityEvent[]> {
    const allEvents: EntityEvent[] = [];
    for (const events of this.events.values()) {
      allEvents.push(...events.filter(e => e.type === type));
    }
    return allEvents;
  }

  async clear(): Promise<void> {
    this.events.clear();
    this.logger.debug('Event store cleared');
  }
}
        )
            ;
    }
};
exports.EntityEventStore = EntityEventStore;
exports.EntityEventStore = EntityEventStore = EntityEventStore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], EntityEventStore);
//# sourceMappingURL=EntityEventStore.js.map