"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPES = void 0;
exports.TYPES = {
    // Services
    DatabaseService: Symbol.for('DatabaseService'),
    ConfigService: Symbol.for('ConfigService'),
    RedisService: Symbol.for('RedisService'),
    EmailService: Symbol.for('EmailService'),
    StorageService: Symbol.for('StorageService'),
    // Repositories
    UserRepository: Symbol.for('UserRepository'),
    AgentRepository: Symbol.for('AgentRepository'),
    WorkflowRepository: Symbol.for('WorkflowRepository'),
    // Controllers
    UserController: Symbol.for('UserController'),
    AgentController: Symbol.for('AgentController'),
    WorkflowController: Symbol.for('WorkflowController'),
};
//# sourceMappingURL=types.js.map