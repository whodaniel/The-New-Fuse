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
exports.NewsFeedController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
// In-memory store for now, will be migrated to Drizzle
const newsStore = [];
let NewsFeedController = class NewsFeedController {
    getNews(limit = 20) {
        return newsStore
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    }
    pushNews(item) {
        const newItem = {
            ...item,
            id: `news-${Date.now()}`,
            timestamp: new Date().toISOString(),
        };
        newsStore.push(newItem);
        // Keep last 500 items
        if (newsStore.length > 500) {
            newsStore.shift();
        }
        return newItem;
    }
};
exports.NewsFeedController = NewsFeedController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get the AI news feed' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], NewsFeedController.prototype, "getNews", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Push a new item to the feed' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NewsFeedController.prototype, "pushNews", null);
exports.NewsFeedController = NewsFeedController = __decorate([
    (0, swagger_1.ApiTags)('marketplace-news'),
    (0, common_1.Controller)('marketplace/news')
], NewsFeedController);
//# sourceMappingURL=news-feed.controller.js.map