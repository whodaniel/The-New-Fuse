"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptTemplatesModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
// @ts-ignore
const database_1 = require("@the-new-fuse/database");
const prompt_templates_controller_1 = require("../controllers/prompt-templates.controller");
const prompt_templates_service_1 = require("../services/prompt-templates.service");
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error('JWT_SECRET must be provided and be at least 32 characters long');
    }
    return secret;
};
let PromptTemplatesModule = class PromptTemplatesModule {
};
exports.PromptTemplatesModule = PromptTemplatesModule;
exports.PromptTemplatesModule = PromptTemplatesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_1.DatabaseModule,
            jwt_1.JwtModule.register({
                secret: getJwtSecret(),
                signOptions: { expiresIn: '24h' }
            })
        ],
        controllers: [prompt_templates_controller_1.PromptTemplatesController],
        providers: [prompt_templates_service_1.PromptTemplatesService],
        exports: [prompt_templates_service_1.PromptTemplatesService],
    })
], PromptTemplatesModule);
//# sourceMappingURL=prompt-templates.module.js.map