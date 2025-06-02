"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCardService = void 0;
const common_1 = require("@nestjs/common");
const agentCard_js_1 = require("../../types/src/agentCard.js");
const axios_1 = __importDefault(require("axios"));
const logger_js_1 = require("../utils/logger.js");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const fs_1 = require("fs");
let AgentCardService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AgentCardService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AgentCardService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        eventEmitter;
        configService;
        discoveredAgents = new Map();
        logger = new logger_js_1.Logger(AgentCardService.name);
        cardStoragePath;
        cardUrlMap = new Map();
        constructor(eventEmitter, configService) {
            this.eventEmitter = eventEmitter;
            this.configService = configService;
            this.cardStoragePath = configService?.get('CARD_STORAGE_PATH') || './agent-cards';
        }
        async discoverAgent(url) {
            try {
                const response = await axios_1.default.get(url);
                const card = agentCard_js_1.agentCardSchema.parse(response.data);
                this.discoveredAgents.set(card.id, card);
                this.cardUrlMap.set(card.id, url);
                this.eventEmitter.emit('agent.discovered', card);
                return card;
            }
            catch (error) {
                this.logger.error(`Failed to discover agent at ${url}`, error);
                throw error;
            }
        }
        async advertiseAgentCard(card, hostUrl) {
            try {
                // Validate card format
                agentCard_js_1.agentCardSchema.parse(card);
                // Store card in file system and register URL
                await this.hostCard(card, hostUrl);
                this.logger.info(`Agent card hosted successfully at ${hostUrl}`);
                this.eventEmitter.emit('agent.advertised', { card, url: hostUrl });
            }
            catch (error) {
                this.logger.error('Failed to advertise agent card', error);
                throw error;
            }
        }
        getDiscoveredAgents() {
            return Array.from(this.discoveredAgents.values());
        }
        getAgentById(id) {
            return this.discoveredAgents.get(id);
        }
        getAgentUrl(id) {
            return this.cardUrlMap.get(id);
        }
        async hostCard(card, hostUrl) {
            // Ensure storage directory exists
            if (!(0, fs_1.existsSync)(this.cardStoragePath)) {
                await (0, promises_1.mkdir)(this.cardStoragePath, { recursive: true });
            }
            // Store card in file system
            const filePath = (0, path_1.join)(this.cardStoragePath, `${card.id}.json`);
            await (0, promises_1.writeFile)(filePath, JSON.stringify({ ...card, hostUrl }, null, 2));
            // Update in-memory storage
            this.discoveredAgents.set(card.id, card);
            this.cardUrlMap.set(card.id, hostUrl);
        }
    };
    return AgentCardService = _classThis;
})();
exports.AgentCardService = AgentCardService;
//# sourceMappingURL=AgentCardService.js.map