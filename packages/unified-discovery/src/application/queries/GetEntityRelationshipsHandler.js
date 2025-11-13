"use strict";
/**
 * Get Entity Relationships Query Handler
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GetEntityRelationshipsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEntityRelationshipsHandler = exports.GetEntityRelationshipsQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
class GetEntityRelationshipsQuery {
    entityId;
    options;
    constructor(entityId, options) {
        this.entityId = entityId;
        this.options = options;
    }
}
exports.GetEntityRelationshipsQuery = GetEntityRelationshipsQuery;
let GetEntityRelationshipsHandler = GetEntityRelationshipsHandler_1 = class GetEntityRelationshipsHandler {
    logger = new common_1.Logger(GetEntityRelationshipsHandler_1.name);
    async execute(query) {
        this.logger.debug(`Getting relationships for entity: ${query.entityId}`);
        // Mock implementation for now
        return {
            entityId: query.entityId,
            relationships: [],
            metadata: {}
        };
    }
};
exports.GetEntityRelationshipsHandler = GetEntityRelationshipsHandler;
exports.GetEntityRelationshipsHandler = GetEntityRelationshipsHandler = GetEntityRelationshipsHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetEntityRelationshipsQuery)
], GetEntityRelationshipsHandler);
//# sourceMappingURL=GetEntityRelationshipsHandler.js.map