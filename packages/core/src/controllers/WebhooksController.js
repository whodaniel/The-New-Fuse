"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = exports.UpdateWebhookDto = exports.CreateWebhookDto = void 0;
const common_1 = require("@nestjs/common");
class CreateWebhookDto {
    name;
    url;
    events;
    active;
    secret;
}
exports.CreateWebhookDto = CreateWebhookDto;
class UpdateWebhookDto {
    name;
    url;
    events;
    active;
    secret;
}
exports.UpdateWebhookDto = UpdateWebhookDto;
let WebhooksController = class WebhooksController {
    constructor() { }
    async create(createWebhookDto) {
        return { message: 'Webhook created', data: createWebhookDto };
    }
    async findAll() {
        return { message: 'All webhooks', data: [] };
    }
    async findOne(id) {
        return { message: `Webhook ${id}, data: { id } };
  }

  async update(@Param('id') id: string, @Body() updateWebhookDto: UpdateWebhookDto) {`,
            return: { message: `Webhook ${id}`, updated, data: updateWebhookDto }
        };
        async;
        remove(, id, string);
        {
            return { message: Webhook, $ };
            {
                id;
            }
            deleted ` };
  }
}
            ;
        }
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateWebhookDto]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "create", null);
__decorate([
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "findOne", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [])
], WebhooksController);
//# sourceMappingURL=WebhooksController.js.map