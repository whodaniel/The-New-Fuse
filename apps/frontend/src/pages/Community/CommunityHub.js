var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { UserGroupIcon, ChatBubbleLeftRightIcon, StarIcon, EyeIcon, HeartIcon, ShareIcon, PlusIcon, MagnifyingGlassIcon, FunnelIcon, ClockIcon, FireIcon, TrophyIcon, BookmarkIcon, UserIcon, TagIcon, ArrowUpIcon, ArrowDownIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
var CommunityHub = function () {
    var _a = useState([]), posts = _a[0], setPosts = _a[1];
    var _b = useState(null), stats = _b[0], setStats = _b[1];
    var _c = useState(true), loading = _c[0], setLoading = _c[1];
    var _d = useState(''), searchQuery = _d[0], setSearchQuery = _d[1];
    var _e = useState('all'), selectedCategory = _e[0], setSelectedCategory = _e[1];
    var _f = useState('recent'), sortBy = _f[0], setSortBy = _f[1];
    var _g = useState(false), showFilters = _g[0], setShowFilters = _g[1];
    var categories = [
        { id: 'all', name: 'All Posts', icon: UserGroupIcon },
        { id: 'general', name: 'General Discussion', icon: ChatBubbleLeftRightIcon },
        { id: 'help', name: 'Help & Support', icon: UserIcon },
        { id: 'showcase', name: 'Showcase', icon: StarIcon },
        { id: 'feedback', name: 'Feedback', icon: ChatBubbleOvalLeftIcon },
        { id: 'announcements', name: 'Announcements', icon: TrophyIcon }
    ];
    var sortOptions = [
        { id: 'recent', name: 'Most Recent', icon: ClockIcon },
        { id: 'popular', name: 'Most Popular', icon: FireIcon },
        { id: 'top', name: 'Top Rated', icon: TrophyIcon },
        { id: 'views', name: 'Most Viewed', icon: EyeIcon }
    ];
    useEffect(function () {
        fetchCommunityData();
    }, [selectedCategory, sortBy, searchQuery]);
    var fetchCommunityData = function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, postsResponse, statsResponse, postsData, statsData, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setLoading(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, 8, 9]);
                    return [4 /*yield*/, Promise.all([
                            fetch("/api/community/posts?category=".concat(selectedCategory, "&sort=").concat(sortBy, "&search=").concat(searchQuery)),
                            fetch('/api/community/stats')
                        ])];
                case 2:
                    _a = _b.sent(), postsResponse = _a[0], statsResponse = _a[1];
                    if (!(postsResponse.ok && statsResponse.ok)) return [3 /*break*/, 5];
                    return [4 /*yield*/, postsResponse.json()];
                case 3:
                    postsData = _b.sent();
                    return [4 /*yield*/, statsResponse.json()];
                case 4:
                    statsData = _b.sent();
                    setPosts(postsData);
                    setStats(statsData);
                    return [3 /*break*/, 6];
                case 5:
                    // Mock data for development
                    setPosts(mockPosts);
                    setStats(mockStats);
                    _b.label = 6;
                case 6: return [3 /*break*/, 9];
                case 7:
                    error_1 = _b.sent();
                    console.error('Failed to fetch community data:', error_1);
                    setPosts(mockPosts);
                    setStats(mockStats);
                    return [3 /*break*/, 9];
                case 8:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var handleVote = function (postId, voteType) { return __awaiter(void 0, void 0, void 0, function () {
        var response, updatedPost_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, fetch("/api/community/posts/".concat(postId, "/vote"), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: voteType })
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    updatedPost_1 = _a.sent();
                    setPosts(posts.map(function (post) { return post.id === postId ? updatedPost_1 : post; }));
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.error('Failed to vote:', error_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleBookmark = function (postId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("/api/community/posts/".concat(postId, "/bookmark"), {
                            method: 'POST'
                        })];
                case 1:
                    response = _a.sent();
                    if (response.ok) {
                        setPosts(posts.map(function (post) {
                            return post.id === postId
                                ? __assign(__assign({}, post), { isBookmarked: !post.isBookmarked, bookmarks: post.isBookmarked ? post.bookmarks - 1 : post.bookmarks + 1 }) : post;
                        }));
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error('Failed to bookmark:', error_3);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleLike = function (postId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("/api/community/posts/".concat(postId, "/like"), {
                            method: 'POST'
                        })];
                case 1:
                    response = _a.sent();
                    if (response.ok) {
                        setPosts(posts.map(function (post) {
                            return post.id === postId
                                ? __assign(__assign({}, post), { isLiked: !post.isLiked }) : post;
                        }));
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _a.sent();
                    console.error('Failed to like:', error_4);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var formatTimeAgo = function (dateString) {
        var date = new Date(dateString);
        var now = new Date();
        var diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        if (diffInHours < 1)
            return 'Just now';
        if (diffInHours < 24)
            return "".concat(diffInHours, "h ago");
        if (diffInHours < 168)
            return "".concat(Math.floor(diffInHours / 24), "d ago");
        return date.toLocaleDateString();
    };
    var mockStats = {
        totalMembers: 12543,
        activeToday: 1247,
        totalPosts: 8932,
        totalComments: 23456
    };
    var mockPosts = [
        {
            id: '1',
            title: 'Best practices for AI agent deployment in production',
            content: 'I\'ve been working on deploying AI agents to production and wanted to share some insights and get feedback from the community...',
            author: {
                id: 'user1',
                name: 'Sarah Chen',
                avatar: '/avatars/sarah.jpg',
                reputation: 2847,
                badges: ['Expert', 'Contributor']
            },
            category: 'general',
            tags: ['deployment', 'production', 'best-practices'],
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            votes: { upvotes: 42, downvotes: 3, userVote: null },
            comments: 18,
            views: 234,
            bookmarks: 15,
            isBookmarked: false,
            isLiked: false,
            isPinned: true,
            isFeatured: true
        },
        {
            id: '2',
            title: 'Help: Agent not responding to custom prompts',
            content: 'I\'m having trouble getting my agent to respond properly to custom prompts. Has anyone encountered this issue?',
            author: {
                id: 'user2',
                name: 'Mike Johnson',
                avatar: '/avatars/mike.jpg',
                reputation: 156,
                badges: ['Newcomer']
            },
            category: 'help',
            tags: ['troubleshooting', 'prompts', 'help'],
            createdAt: '2024-01-15T08:15:00Z',
            updatedAt: '2024-01-15T08:15:00Z',
            votes: { upvotes: 8, downvotes: 0, userVote: null },
            comments: 12,
            views: 89,
            bookmarks: 3,
            isBookmarked: false,
            isLiked: false,
            isPinned: false,
            isFeatured: false
        },
        {
            id: '3',
            title: 'Showcase: My AI-powered customer service bot',
            content: 'Just finished building an AI customer service bot that handles 90% of inquiries automatically. Here\'s how I did it...',
            author: {
                id: 'user3',
                name: 'Alex Rodriguez',
                avatar: '/avatars/alex.jpg',
                reputation: 1923,
                badges: ['Innovator', 'Helper']
            },
            category: 'showcase',
            tags: ['showcase', 'customer-service', 'automation'],
            createdAt: '2024-01-14T16:45:00Z',
            updatedAt: '2024-01-14T16:45:00Z',
            votes: { upvotes: 67, downvotes: 2, userVote: 'up' },
            comments: 24,
            views: 456,
            bookmarks: 28,
            isBookmarked: true,
            isLiked: true,
            isPinned: false,
            isFeatured: true
        }
    ];
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Community Hub" }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mt-2", children: "Connect, share, and learn with the AI community" })] }), _jsxs("button", { className: "flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(PlusIcon, { className: "w-5 h-5" }), _jsx("span", { children: "New Post" })] })] }), stats && (_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-4 text-center", children: [_jsx(UserGroupIcon, { className: "w-8 h-8 text-blue-600 mx-auto mb-2" }), _jsx("div", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: stats.totalMembers.toLocaleString() }), _jsx("div", { className: "text-sm text-gray-600 dark:text-gray-300", children: "Members" })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-4 text-center", children: [_jsx(FireIcon, { className: "w-8 h-8 text-green-600 mx-auto mb-2" }), _jsx("div", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: stats.activeToday.toLocaleString() }), _jsx("div", { className: "text-sm text-gray-600 dark:text-gray-300", children: "Active Today" })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-4 text-center", children: [_jsx(ChatBubbleLeftRightIcon, { className: "w-8 h-8 text-purple-600 mx-auto mb-2" }), _jsx("div", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: stats.totalPosts.toLocaleString() }), _jsx("div", { className: "text-sm text-gray-600 dark:text-gray-300", children: "Posts" })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-4 text-center", children: [_jsx(ChatBubbleOvalLeftIcon, { className: "w-8 h-8 text-orange-600 mx-auto mb-2" }), _jsx("div", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: stats.totalComments.toLocaleString() }), _jsx("div", { className: "text-sm text-gray-600 dark:text-gray-300", children: "Comments" })] })] })), _jsxs("div", { className: "flex flex-col md:flex-row gap-4 mb-6", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(MagnifyingGlassIcon, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search posts...", value: searchQuery, onChange: function (e) { return setSearchQuery(e.target.value); }, className: "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" })] }), _jsxs("button", { onClick: function () { return setShowFilters(!showFilters); }, className: "flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", children: [_jsx(FunnelIcon, { className: "w-5 h-5" }), _jsx("span", { children: "Filters" })] })] }), showFilters && (_jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Category" }), _jsx("select", { value: selectedCategory, onChange: function (e) { return setSelectedCategory(e.target.value); }, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white", title: "Select category", children: categories.map(function (category) { return (_jsx("option", { value: category.id, children: category.name }, category.id)); }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Sort By" }), _jsx("select", { value: sortBy, onChange: function (e) { return setSortBy(e.target.value); }, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white", title: "Sort posts by", children: sortOptions.map(function (option) { return (_jsx("option", { value: option.id, children: option.name }, option.id)); }) })] })] }) }))] }), _jsx("div", { className: "space-y-4", children: posts.map(function (post) {
                        var _a;
                        return (_jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow ".concat(post.isPinned ? 'border-l-4 border-l-blue-500' : ''), children: _jsxs("div", { className: "flex items-start space-x-4", children: [_jsxs("div", { className: "flex flex-col items-center space-y-1 min-w-0", children: [_jsx("button", { onClick: function () { return handleVote(post.id, 'up'); }, className: "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ".concat(post.votes.userVote === 'up' ? 'text-green-600' : 'text-gray-400'), title: "Upvote", children: _jsx(ArrowUpIcon, { className: "w-5 h-5" }) }), _jsx("span", { className: "text-sm font-medium text-gray-900 dark:text-white", children: post.votes.upvotes - post.votes.downvotes }), _jsx("button", { onClick: function () { return handleVote(post.id, 'down'); }, className: "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ".concat(post.votes.userVote === 'down' ? 'text-red-600' : 'text-gray-400'), title: "Downvote", children: _jsx(ArrowDownIcon, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "flex items-start justify-between mb-2", children: _jsxs("div", { className: "flex items-center space-x-2", children: [post.isPinned && (_jsx("span", { className: "inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full", children: "Pinned" })), post.isFeatured && (_jsxs("span", { className: "inline-flex items-center px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full", children: [_jsx(StarSolidIcon, { className: "w-3 h-3 mr-1" }), "Featured"] })), _jsx("span", { className: "inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full", children: ((_a = categories.find(function (c) { return c.id === post.category; })) === null || _a === void 0 ? void 0 : _a.name) || post.category })] }) }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer", children: post.title }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mb-3 line-clamp-2", children: post.content }), post.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mb-3", children: post.tags.map(function (tag) { return (_jsxs("span", { className: "inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer", children: [_jsx(TagIcon, { className: "w-3 h-3 mr-1" }), tag] }, tag)); }) })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center", children: _jsx(UserIcon, { className: "w-4 h-4 text-gray-600 dark:text-gray-300" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-900 dark:text-white", children: post.author.name }), _jsxs("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: [post.author.reputation, " rep"] })] }), _jsx("div", { className: "flex items-center space-x-1", children: post.author.badges.map(function (badge) { return (_jsx("span", { className: "text-xs text-blue-600 dark:text-blue-400", children: badge }, badge)); }) })] })] }), _jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: formatTimeAgo(post.createdAt) })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "flex items-center space-x-1 text-gray-500 dark:text-gray-400", children: [_jsx(EyeIcon, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm", children: post.views })] }), _jsxs("div", { className: "flex items-center space-x-1 text-gray-500 dark:text-gray-400", children: [_jsx(ChatBubbleOvalLeftIcon, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm", children: post.comments })] }), _jsx("button", { onClick: function () { return handleLike(post.id); }, className: "flex items-center space-x-1 transition-colors ".concat(post.isLiked ? 'text-red-600' : 'text-gray-500 dark:text-gray-400 hover:text-red-600'), title: "Like post", children: post.isLiked ? (_jsx(HeartSolidIcon, { className: "w-4 h-4" })) : (_jsx(HeartIcon, { className: "w-4 h-4" })) }), _jsxs("button", { onClick: function () { return handleBookmark(post.id); }, className: "flex items-center space-x-1 transition-colors ".concat(post.isBookmarked ? 'text-yellow-600' : 'text-gray-500 dark:text-gray-400 hover:text-yellow-600'), title: "Bookmark post", children: [post.isBookmarked ? (_jsx(BookmarkSolidIcon, { className: "w-4 h-4" })) : (_jsx(BookmarkIcon, { className: "w-4 h-4" })), _jsx("span", { className: "text-sm", children: post.bookmarks })] }), _jsx("button", { className: "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors", title: "Share post", children: _jsx(ShareIcon, { className: "w-4 h-4" }) })] })] })] })] }) }, post.id));
                    }) }), _jsx("div", { className: "text-center mt-8", children: _jsx("button", { className: "px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", children: "Load More Posts" }) })] }) }));
};
export default CommunityHub;
