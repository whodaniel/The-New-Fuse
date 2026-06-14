"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMIntelController = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const DATA_DIR = path.resolve(process.cwd(), 'data/llm-intel');
let LLMIntelController = class LLMIntelController {
    async getRankingRecommendations() {
        const filePath = path.join(DATA_DIR, 'ranking-recommendations.json');
        try {
            const raw = await fs_1.promises.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        }
        catch {
            return { compositeScores: [], recommendations: [], newsDigest: [], summary: {}, generatedAt: null };
        }
    }
    async getArenaIntelLatest() {
        const filePath = path.join(DATA_DIR, 'arena-intel-latest.json');
        try {
            const raw = await fs_1.promises.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        }
        catch {
            return { arenaData: [], newsData: [], nvidiaHealth: [], summary: {} };
        }
    }
    async getRankingReport() {
        const filePath = path.join(DATA_DIR, 'ranking-report-latest.md');
        try {
            const raw = await fs_1.promises.readFile(filePath, 'utf8');
            return { report: raw };
        }
        catch {
            return { report: null };
        }
    }
    async getHistory() {
        const historyDir = path.join(DATA_DIR, 'history');
        try {
            const files = await fs_1.promises.readdir(historyDir);
            const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse().slice(0, 7);
            const snapshots = await Promise.all(jsonFiles.map(async (f) => {
                const raw = await fs_1.promises.readFile(path.join(historyDir, f), 'utf8');
                return { file: f, data: JSON.parse(raw) };
            }));
            return snapshots;
        }
        catch {
            return [];
        }
    }
};
exports.LLMIntelController = LLMIntelController;
__decorate([
    (0, common_1.Get)('ranking-recommendations'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.ADMIN),
    (0, secure_auth_guard_1.SetRateLimitTier)(secure_auth_guard_1.RateLimitTier.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LLMIntelController.prototype, "getRankingRecommendations", null);
__decorate([
    (0, common_1.Get)('arena-intel-latest'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.ADMIN),
    (0, secure_auth_guard_1.SetRateLimitTier)(secure_auth_guard_1.RateLimitTier.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LLMIntelController.prototype, "getArenaIntelLatest", null);
__decorate([
    (0, common_1.Get)('ranking-report'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.ADMIN),
    (0, secure_auth_guard_1.SetRateLimitTier)(secure_auth_guard_1.RateLimitTier.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LLMIntelController.prototype, "getRankingReport", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.ADMIN),
    (0, secure_auth_guard_1.SetRateLimitTier)(secure_auth_guard_1.RateLimitTier.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LLMIntelController.prototype, "getHistory", null);
exports.LLMIntelController = LLMIntelController = __decorate([
    (0, common_1.Controller)('llm-intel')
], LLMIntelController);
//# sourceMappingURL=llm-intel.controller.js.map