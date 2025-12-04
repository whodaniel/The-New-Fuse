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
import { request } from '@/utils/request';
var Workspace = /** @class */ (function () {
    function Workspace() {
    }
    Workspace.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, request('/api/workspaces', {
                        method: 'POST',
                        body: JSON.stringify(data),
                    })];
            });
        });
    };
    Workspace.get = function (slug) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, request("/api/workspaces/".concat(slug))];
            });
        });
    };
    Workspace.update = function (slug, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, request("/api/workspaces/".concat(slug), {
                        method: 'PUT',
                        body: JSON.stringify(data),
                    })];
            });
        });
    };
    Workspace.delete = function (slug) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, request("/api/workspaces/".concat(slug), {
                        method: 'DELETE',
                    })];
            });
        });
    };
    Workspace.getThreads = function (slug) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, request("/api/workspaces/".concat(slug, "/threads"))];
            });
        });
    };
    Workspace.getStats = function (slug) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, request("/api/workspaces/".concat(slug, "/stats"))];
            });
        });
    };
    Workspace.getSettings = function (slug) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, request("/api/workspaces/".concat(slug, "/settings"))];
            });
        });
    };
    Workspace.updateSettings = function (slug, settings) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, request("/api/workspaces/".concat(slug, "/settings"), {
                        method: 'PUT',
                        body: JSON.stringify(settings),
                    })];
            });
        });
    };
    Workspace.deleteUserMessage = function (slug, threadSlug, chatId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, request("/api/workspaces/".concat(slug, "/threads/").concat(threadSlug, "/messages/").concat(chatId), {
                        method: 'DELETE',
                    })];
            });
        });
    };
    Workspace.deleteAssistantMessage = function (slug, threadSlug, chatId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, request("/api/workspaces/".concat(slug, "/threads/").concat(threadSlug, "/messages/").concat(chatId, "/assistant"), {
                        method: 'DELETE',
                    })];
            });
        });
    };
    Workspace.updateChatResponse = function (slug, threadSlug, chatId, content) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, request("/api/workspaces/".concat(slug, "/threads/").concat(threadSlug, "/messages/").concat(chatId), {
                        method: 'PUT',
                        body: JSON.stringify({ content: content }),
                    })];
            });
        });
    };
    Workspace.submitMessageFeedback = function (slug, chatId, score) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, request("/api/workspaces/".concat(slug, "/messages/").concat(chatId, "/feedback"), {
                        method: 'POST',
                        body: JSON.stringify({ score: score }),
                    })];
            });
        });
    };
    Workspace.getMessageTTS = function (slug, chatId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, request("/api/workspaces/".concat(slug, "/messages/").concat(chatId, "/tts"), {
                        headers: {
                            'Accept': 'audio/mp3',
                        },
                        responseType: 'arraybuffer',
                    })];
            });
        });
    };
    Workspace.forkThread = function (slug, threadSlug, chatId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, request("/api/workspaces/".concat(slug, "/threads/").concat(threadSlug, "/fork"), {
                            method: 'POST',
                            body: JSON.stringify({ chatId: chatId }),
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.threadSlug];
                }
            });
        });
    };
    Workspace.uploadFile = function (slug, file, onProgress) {
        return __awaiter(this, void 0, void 0, function () {
            var formData;
            return __generator(this, function (_a) {
                formData = new FormData();
                formData.append('file', file);
                return [2 /*return*/, request("/api/workspaces/".concat(slug, "/files"), {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json',
                        },
                        onProgress: onProgress,
                    })];
            });
        });
    };
    return Workspace;
}());
export default Workspace;
