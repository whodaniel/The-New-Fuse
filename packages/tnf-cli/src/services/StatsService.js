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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class StatsService {
    constructor(statsPath) {
        this.records = [];
        this.statsPath = statsPath || path.join(os.homedir(), '.local', 'share', 'tnf', 'stats.json');
        this.loadStats();
    }
    loadStats() {
        if (fs.existsSync(this.statsPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.statsPath, 'utf8'));
                this.records = Array.isArray(data) ? data : (data.records || []);
            }
            catch {
                this.records = [];
            }
        }
    }
    saveStats() {
        const dir = path.dirname(this.statsPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.statsPath, JSON.stringify(this.records, null, 2));
    }
    async record(record) {
        const fullRecord = {
            ...record,
            timestamp: new Date().toISOString(),
        };
        this.records.push(fullRecord);
        this.saveStats();
    }
    async getSummary(options = {}) {
        let filtered = [...this.records];
        if (options.days) {
            const since = Date.now() - options.days * 24 * 60 * 60 * 1000;
            filtered = filtered.filter(r => new Date(r.timestamp).getTime() >= since);
        }
        if (options.provider) {
            filtered = filtered.filter(r => r.provider === options.provider);
        }
        if (options.model) {
            filtered = filtered.filter(r => r.model === options.model);
        }
        if (options.project !== undefined) {
            if (options.project === '') {
                filtered = filtered.filter(r => !r.project);
            }
            else {
                filtered = filtered.filter(r => r.project === options.project);
            }
        }
        const summary = {
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalTokens: 0,
            totalCost: 0,
            byProvider: {},
            byModel: {},
            byTool: {},
            byProject: {},
        };
        for (const record of filtered) {
            summary.totalInputTokens += record.inputTokens;
            summary.totalOutputTokens += record.outputTokens;
            summary.totalTokens += record.totalTokens;
            summary.totalCost += record.cost;
            if (!summary.byProvider[record.provider]) {
                summary.byProvider[record.provider] = { tokens: 0, cost: 0, count: 0 };
            }
            summary.byProvider[record.provider].tokens += record.totalTokens;
            summary.byProvider[record.provider].cost += record.cost;
            summary.byProvider[record.provider].count += 1;
            if (!summary.byModel[record.model]) {
                summary.byModel[record.model] = { tokens: 0, cost: 0, count: 0 };
            }
            summary.byModel[record.model].tokens += record.totalTokens;
            summary.byModel[record.model].cost += record.cost;
            summary.byModel[record.model].count += 1;
            if (record.tool) {
                if (!summary.byTool[record.tool]) {
                    summary.byTool[record.tool] = { tokens: 0, cost: 0, count: 0 };
                }
                summary.byTool[record.tool].tokens += record.totalTokens;
                summary.byTool[record.tool].cost += record.cost;
                summary.byTool[record.tool].count += 1;
            }
            if (record.project) {
                if (!summary.byProject[record.project]) {
                    summary.byProject[record.project] = { tokens: 0, cost: 0, count: 0 };
                }
                summary.byProject[record.project].tokens += record.totalTokens;
                summary.byProject[record.project].cost += record.cost;
                summary.byProject[record.project].count += 1;
            }
        }
        return summary;
    }
    async close() {
        this.saveStats();
    }
}
exports.StatsService = StatsService;
//# sourceMappingURL=StatsService.js.map