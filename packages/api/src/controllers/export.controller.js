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
import { Controller, Post, Body, Res, HttpStatus, UseGuards } from '@nestjs/common';
// import { ConversationExportService, ExportFormat } from '@the-new-fuse/core';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { JwtAuthGuard } from '../modules/guards/jwt-auth.guard';
class ExportConversationDto {
    conversation;
    format;
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], ExportConversationDto.prototype, "conversation", void 0);
__decorate([
    IsString(),
    IsIn(['pdf', 'md', 'txt']),
    __metadata("design:type", String)
], ExportConversationDto.prototype, "format", void 0);
let ExportController = class ExportController {
    constructor() { }
    /**
     * POST /api/v1/export/conversation
     * Body: { conversation: string, format: "pdf" | "md" | "txt" }
     * Response: PDF or text/markdown file
     */
    async exportConversation(body, res) {
        const { conversation, format } = body;
        if (!conversation || !format) {
            return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing conversation or format' });
        }
        try {
            // TODO: Re-enable once core package is fixed
            // const buffer = await ConversationExportService.export(conversation, format);
            res.status(HttpStatus.NOT_IMPLEMENTED).json({
                error: 'Export service temporarily disabled - core package needs repair'
            });
        }
        catch (err) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message || 'Export failed' });
        }
    }
};
__decorate([
    Post('conversation'),
    __param(0, Body()),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ExportConversationDto, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportConversation", null);
ExportController = __decorate([
    UseGuards(JwtAuthGuard),
    Controller('export'),
    __metadata("design:paramtypes", [])
], ExportController);
export { ExportController };
//# sourceMappingURL=export.controller.js.map