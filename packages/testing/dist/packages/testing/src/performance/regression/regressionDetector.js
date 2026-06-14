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
exports.RegressionDetector = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class RegressionDetector {
    constructor(baselinePath = path.join(process.cwd(), 'performance-baselines'), thresholds = {
        maxDurationIncrease: 10, // 10% increase in duration
        maxMemoryIncrease: 15, // 15% increase in memory
        minSignificantChange: 5 // 5% minimum change to be considered significant
    }) {
        this.baselinePath = baselinePath;
        this.thresholds = thresholds;
    }
    async saveBaseline(testName, results, environment = process.env.NODE_ENV || 'development') {
        await this.ensureBaselineDirectory();
        const baselineFile = path.join(this.baselinePath, `${testName}.json`);
        const baseline = {
            timestamp: Date.now(),
            environment,
            metrics: {
                [environment]: results
            }
        };
        let existingBaseline;
        try {
            const content = await fs.readFile(baselineFile, 'utf-8');
            existingBaseline = JSON.parse(content);
            existingBaseline.metrics[environment] = results;
            await fs.writeFile(baselineFile, JSON.stringify(existingBaseline, null, 2));
        }
        catch (error) {
            await fs.writeFile(baselineFile, JSON.stringify(baseline, null, 2));
        }
    }
    async detectRegression(testName, currentResults, environment = process.env.NODE_ENV || 'development') {
        const baseline = await this.loadBaseline(testName, environment);
        if (!baseline) {
            throw new Error(`No baseline found for test "${testName}" in environment "${environment}"`);
        }
        const baselineMetrics = baseline.metrics[environment];
        const regressions = {};
        const improvements = {};
        // Check for duration regressions
        const durationChange = this.calculatePercentChange(baselineMetrics.stats.mean, currentResults.stats.mean);
        if (Math.abs(durationChange) >= (this.thresholds.minSignificantChange || 0)) {
            const changeMetric = {
                metric: 'duration',
                baselineValue: baselineMetrics.stats.mean,
                currentValue: currentResults.stats.mean,
                difference: currentResults.stats.mean - baselineMetrics.stats.mean,
                percentChange: durationChange
            };
            if (durationChange > (this.thresholds.maxDurationIncrease || 0)) {
                regressions[testName] = [changeMetric];
            }
            else if (durationChange < 0) {
                improvements[testName] = [changeMetric];
            }
        }
        // Check for memory regressions
        const baselineMemoryMean = this.calculateMeanMemoryUsage(baselineMetrics.results);
        const currentMemoryMean = this.calculateMeanMemoryUsage(currentResults.results);
        const memoryChange = this.calculatePercentChange(baselineMemoryMean, currentMemoryMean);
        if (Math.abs(memoryChange) >= (this.thresholds.minSignificantChange || 0)) {
            const changeMetric = {
                metric: 'memory',
                baselineValue: baselineMemoryMean,
                currentValue: currentMemoryMean,
                difference: currentMemoryMean - baselineMemoryMean,
                percentChange: memoryChange
            };
            if (memoryChange > (this.thresholds.maxMemoryIncrease || 0)) {
                regressions[testName] = [...(regressions[testName] || []), changeMetric];
            }
            else if (memoryChange < 0) {
                improvements[testName] = [...(improvements[testName] || []), changeMetric];
            }
        }
        return {
            hasRegression: Object.keys(regressions).length > 0,
            regressions,
            improvements
        };
    }
    async loadBaseline(testName, environment) {
        try {
            const content = await fs.readFile(path.join(this.baselinePath, `${testName}.json`), 'utf-8');
            const baseline = JSON.parse(content);
            return baseline.metrics[environment] ? baseline : null;
        }
        catch (error) {
            return null;
        }
    }
    async ensureBaselineDirectory() {
        try {
            await fs.access(this.baselinePath);
        }
        catch {
            await fs.mkdir(this.baselinePath, { recursive: true });
        }
    }
    calculateMeanMemoryUsage(results) {
        return results.reduce((sum, result) => sum + result.memoryDiff, 0) / results.length;
    }
    calculatePercentChange(baseline, current) {
        return ((current - baseline) / baseline) * 100;
    }
}
exports.RegressionDetector = RegressionDetector;
//# sourceMappingURL=regressionDetector.js.map