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
exports.ExportController = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("@the-new-fuse/types");
// Mock conversation export service - this should be replaced with actual implementation
class ConversationExportService {
    static async export(conversation, format) {
        // Placeholder implementation
        const content = JSON.stringify(conversation, null, 2);
        return Buffer.from(content, 'utf-8');
    }
}
let ExportController = class ExportController {
    exportService = ConversationExportService;
    async exportConversation(body, res) {
        try {
            const { conversation, format } = body;
            const buffer = await this.exportService.export(conversation, format);
            const mimeType = format === types_1.ExportFormat.MARKDOWN ? 'text/markdown' :
                format === types_1.ExportFormat.HTML ? 'text/html' :
                    'application/json';
            const extension = format === types_1.ExportFormat.MARKDOWN ? 'md' :
                format === types_1.ExportFormat.HTML ? 'html' :
                    'json';
            res.set({
                'Content-Type': mimeType,
                'Content-Disposition': `attachment; filename="conversation.${extension}"`,
                'Content-Length': buffer.length.toString(),
            });
            return res.send(buffer);
        }
        catch (error) {
            throw new common_1.HttpException('Export failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.ExportController = ExportController;
__decorate([
    (0, common_1.Post)('conversation'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportConversation", null);
exports.ExportController = ExportController = __decorate([
    (0, common_1.Controller)('export')
], ExportController);
