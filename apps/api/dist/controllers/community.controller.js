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
exports.CommunityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const SEED_POSTS = [
    {
        id: 'post-welcome-1',
        title: 'Welcome to The New Fuse Community',
        content: 'Share your builds, ask for support, and exchange ideas with other creators in the network.',
        author: {
            id: 'tnf-core',
            name: 'TNF Core',
            avatar: 'https://thenewfuse.com/favicon.ico',
            reputation: 9800,
            badges: ['admin', 'founder'],
        },
        category: 'announcements',
        tags: ['welcome', 'community'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        votes: { upvotes: 42, downvotes: 1, userVote: null },
        comments: 12,
        views: 640,
        bookmarks: 20,
        isBookmarked: false,
        isLiked: false,
        isPinned: true,
        isFeatured: true,
    },
    {
        id: 'post-showcase-1',
        title: 'Built a workflow that triages PR checks automatically',
        content: 'Using TNF agents and webhook automations, I reduced CI triage time by 70%. Happy to share setup details.',
        author: {
            id: 'user-amber',
            name: 'Amber',
            avatar: 'https://placehold.co/48x48?text=A',
            reputation: 1340,
            badges: ['builder'],
        },
        category: 'showcase',
        tags: ['workflow', 'automation', 'ci'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
        votes: { upvotes: 27, downvotes: 0, userVote: null },
        comments: 8,
        views: 221,
        bookmarks: 14,
        isBookmarked: false,
        isLiked: false,
        isPinned: false,
        isFeatured: true,
    },
    {
        id: 'post-help-1',
        title: 'How are you handling staged deploy rollbacks?',
        content: 'Looking for practical rollback patterns across CloudRuntime services with zero-downtime frontend fallbacks.',
        author: {
            id: 'user-delta',
            name: 'Delta',
            avatar: 'https://placehold.co/48x48?text=D',
            reputation: 720,
            badges: ['member'],
        },
        category: 'help',
        tags: ['deploy', 'cloud_runtime', 'rollback'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        votes: { upvotes: 11, downvotes: 0, userVote: null },
        comments: 4,
        views: 93,
        bookmarks: 6,
        isBookmarked: false,
        isLiked: false,
        isPinned: false,
        isFeatured: false,
    },
];
// In-memory store keeps the community UI operational when external data services are unavailable.
const postsStore = SEED_POSTS.map((post) => ({ ...post }));
let CommunityController = class CommunityController {
    listPosts(category, sort = 'recent', search) {
        const normalizedCategory = (category || 'all').toLowerCase();
        const normalizedSearch = (search || '').trim().toLowerCase();
        let items = [...postsStore];
        if (normalizedCategory !== 'all') {
            items = items.filter((post) => post.category.toLowerCase() === normalizedCategory);
        }
        if (normalizedSearch) {
            items = items.filter((post) => {
                const haystack = `${post.title} ${post.content} ${post.tags.join(' ')}`.toLowerCase();
                return haystack.includes(normalizedSearch);
            });
        }
        if (sort === 'popular') {
            items.sort((a, b) => b.comments - a.comments);
        }
        else if (sort === 'top') {
            items.sort((a, b) => b.votes.upvotes - b.votes.downvotes - (a.votes.upvotes - a.votes.downvotes));
        }
        else if (sort === 'views') {
            items.sort((a, b) => b.views - a.views);
        }
        else {
            items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        }
        return items;
    }
    getStats() {
        const totalComments = postsStore.reduce((sum, post) => sum + post.comments, 0);
        return {
            totalMembers: 1230,
            activeToday: 94,
            totalPosts: postsStore.length,
            totalComments,
        };
    }
    voteOnPost(postId, body) {
        const post = postsStore.find((entry) => entry.id === postId);
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        if (body?.type === 'up') {
            post.votes.upvotes += 1;
            post.votes.userVote = 'up';
        }
        else if (body?.type === 'down') {
            post.votes.downvotes += 1;
            post.votes.userVote = 'down';
        }
        post.updatedAt = new Date().toISOString();
        return post;
    }
    toggleBookmark(postId) {
        const post = postsStore.find((entry) => entry.id === postId);
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        post.isBookmarked = !post.isBookmarked;
        post.bookmarks += post.isBookmarked ? 1 : -1;
        if (post.bookmarks < 0) {
            post.bookmarks = 0;
        }
        post.updatedAt = new Date().toISOString();
        return { success: true, isBookmarked: post.isBookmarked, bookmarks: post.bookmarks };
    }
    toggleLike(postId) {
        const post = postsStore.find((entry) => entry.id === postId);
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        post.isLiked = !post.isLiked;
        post.updatedAt = new Date().toISOString();
        return { success: true, isLiked: post.isLiked };
    }
};
exports.CommunityController = CommunityController;
__decorate([
    (0, common_1.Get)('posts'),
    (0, swagger_1.ApiOperation)({ summary: 'List community posts with filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of community posts' }),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('sort')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "listPosts", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Community overview metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Community stats payload' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('posts/:postId/vote'),
    (0, swagger_1.ApiOperation)({ summary: 'Vote on a post' }),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "voteOnPost", null);
__decorate([
    (0, common_1.Post)('posts/:postId/bookmark'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle bookmark on a post' }),
    __param(0, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "toggleBookmark", null);
__decorate([
    (0, common_1.Post)('posts/:postId/like'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle like on a post' }),
    __param(0, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "toggleLike", null);
exports.CommunityController = CommunityController = __decorate([
    (0, swagger_1.ApiTags)('community'),
    (0, common_1.Controller)('community')
], CommunityController);
//# sourceMappingURL=community.controller.js.map