"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const database_1 = require("@the-new-fuse/database");
const agent_bank_controller_1 = require("../controllers/agent-bank.controller");
const agent_crafting_controller_1 = require("../controllers/agent-crafting.controller");
const agent_controller_1 = require("../controllers/agent.controller");
const security_logging_service_1 = require("../security/security-logging.service");
const agent_bank_service_1 = require("../services/agent-bank.service");
const agent_service_1 = require("../services/agent.service");
const billing_module_1 = require("./billing/billing.module");
let AgentModule = class AgentModule {
};
exports.AgentModule = AgentModule;
exports.AgentModule = AgentModule = __decorate([
    (0, common_1.Module)({
        imports: [database_1.DatabaseModule, jwt_1.JwtModule, config_1.ConfigModule, billing_module_1.BillingModule],
        controllers: [agent_controller_1.AgentController, agent_bank_controller_1.AgentBankController, agent_crafting_controller_1.AgentCraftingController],
        providers: [agent_service_1.AgentService, agent_bank_service_1.AgentBankService, security_logging_service_1.SecurityLoggingService],
        exports: [agent_service_1.AgentService, agent_bank_service_1.AgentBankService],
    })
], AgentModule);
//# sourceMappingURL=agent.module.js.map