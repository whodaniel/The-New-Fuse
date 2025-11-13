"use strict";
/**
 * Entity Discovered Event Handler
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EntityDiscoveredHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityDiscoveredHandler = exports.EntityDiscoveredEvent = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
class EntityDiscoveredEvent {
    entityId;
    entityType;
    metadata;
    constructor(entityId, entityType, metadata) {
        this.entityId = entityId;
        this.entityType = entityType;
        this.metadata = metadata;
    }
}
exports.EntityDiscoveredEvent = EntityDiscoveredEvent;
let EntityDiscoveredHandler = EntityDiscoveredHandler_1 = class EntityDiscoveredHandler {
    logger = new common_1.Logger(EntityDiscoveredHandler_1.name);
    handle(event) {
        this.logger.debug(`Entity discovered: ${event.entityId} of type ${event.entityType}`);
        // Handle entity discovered event
    }
};
exports.EntityDiscoveredHandler = EntityDiscoveredHandler;
exports.EntityDiscoveredHandler = EntityDiscoveredHandler = EntityDiscoveredHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.EventsHandler)(EntityDiscoveredEvent)
], EntityDiscoveredHandler);
//# sourceMappingURL=EntityDiscoveredHandler.js.map