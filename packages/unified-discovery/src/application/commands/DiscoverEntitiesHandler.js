"use strict";
/**
 * Discover Entities Command Handler
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DiscoverEntitiesHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoverEntitiesHandler = exports.DiscoverEntitiesCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
class DiscoverEntitiesCommand {
    paths;
    options;
    constructor(paths, options) {
        this.paths = paths;
        this.options = options;
    }
}
exports.DiscoverEntitiesCommand = DiscoverEntitiesCommand;
let DiscoverEntitiesHandler = DiscoverEntitiesHandler_1 = class DiscoverEntitiesHandler {
    logger = new common_1.Logger(DiscoverEntitiesHandler_1.name);
    async execute(command) {
        this.logger.debug(`Discovering entities in paths: ${command.paths.join(', ')}`);
        // Mock implementation for now
        return {
            entities: [],
            statistics: {
                filesProcessed: 0,
                entitiesBySource: {},
                entitiesByArchetype: {}
            },
            duration: 0,
            errors: []
        };
    }
};
exports.DiscoverEntitiesHandler = DiscoverEntitiesHandler;
exports.DiscoverEntitiesHandler = DiscoverEntitiesHandler = DiscoverEntitiesHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(DiscoverEntitiesCommand)
], DiscoverEntitiesHandler);
//# sourceMappingURL=DiscoverEntitiesHandler.js.map