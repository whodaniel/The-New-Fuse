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
exports.LoadTestingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util = __importStar(require("util"));
const child_process = __importStar(require("child_process"));
const exec = util.promisify(child_process.exec);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);
let LoadTestingService = class LoadTestingService {
    constructor(configService) {
        this.configService = configService;
        this.outputDir = this.configService.get('testing.loadTesting.outputDir', 'test-results/load-tests');
    }
    /**
     * Run a load test using k6
     */
    async runLoadTest(config) {
        // Ensure output directory exists
        await mkdir(this.outputDir, { recursive: true });
        // Generate k6 script
        const scriptPath = await this.generateK6Script(config);
        // Run k6
        const { stdout, stderr } = await exec(`k6 run ${scriptPath}`);
        // Parse results
        const result = this.parseK6Output(stdout, config);
        // Save results
        await this.saveResults(result);
        return result;
    }
    /**
     * Generate a k6 script from a configuration
     */
    async generateK6Script(config) {
        const scriptContent = `
      import http from 'k6/http';
      import { check, sleep } from 'k6';
      
      export const options = {
        vus: ${config.connections},
        duration: '${config.duration}s',
        thresholds: {
          http_req_duration: ['p(95)<${config.assertions?.responseTime || 500}'],
          http_req_failed: ['rate<${(config.assertions?.failureRate || 0.01) * 100}%']
        }
      };
      
      export default function() {
        const url = '${config.url}';
        const params = {
          headers: ${JSON.stringify(config.headers || {})},
        };
        
        ${config.body ? `const payload = ${JSON.stringify(config.body)};` : ''}
        
        const response = http.${config.method.toLowerCase()}(url, ${config.body ? 'payload, ' : ''}params);
        
        check(response, {
          'status is ${config.assertions?.statusCode || 200}': (r) => r.status === ${config.assertions?.statusCode || 200},
        });
        
        sleep(1 / ${config.rate});
      }
    `;
        const scriptPath = path.join(this.outputDir, `load-test-${Date.now()}.js`);
        await writeFile(scriptPath, scriptContent);
        return scriptPath;
    }
    /**
     * Parse k6 output into a structured result
     */
    parseK6Output(output, config) {
        // Extract metrics from k6 output
        const httpReqDurationAvg = this.extractMetric(output, 'http_req_duration', 'avg');
        const httpReqDurationMin = this.extractMetric(output, 'http_req_duration', 'min');
        const httpReqDurationMax = this.extractMetric(output, 'http_req_duration', 'max');
        const httpReqDurationP50 = this.extractMetric(output, 'http_req_duration', 'p(50)');
        const httpReqDurationP90 = this.extractMetric(output, 'http_req_duration', 'p(90)');
        const httpReqDurationP95 = this.extractMetric(output, 'http_req_duration', 'p(95)');
        const httpReqDurationP99 = this.extractMetric(output, 'http_req_duration', 'p(99)');
        const httpReqs = this.extractMetric(output, 'http_reqs', 'count');
        const httpReqsFailed = this.extractMetric(output, 'http_req_failed', 'rate');
        const httpReqsPerSec = this.extractMetric(output, 'http_reqs', 'rate');
        const failureRate = httpReqsFailed / 100; // Convert from percentage to decimal
        const successfulRequests = Math.round(httpReqs * (1 - failureRate));
        const failedRequests = Math.round(httpReqs * failureRate);
        // Check assertions
        const responseTimePassed = !config.assertions?.responseTime || httpReqDurationP95 <= config.assertions.responseTime;
        const failureRatePassed = !config.assertions?.failureRate || failureRate <= config.assertions.failureRate;
        return {
            summary: {
                totalRequests: httpReqs,
                successfulRequests,
                failedRequests,
                requestsPerSecond: httpReqsPerSec,
                averageResponseTime: httpReqDurationAvg,
                minResponseTime: httpReqDurationMin,
                maxResponseTime: httpReqDurationMax,
                p50ResponseTime: httpReqDurationP50,
                p90ResponseTime: httpReqDurationP90,
                p95ResponseTime: httpReqDurationP95,
                p99ResponseTime: httpReqDurationP99
            },
            assertions: {
                passed: responseTimePassed && failureRatePassed,
                details: {
                    responseTime: config.assertions?.responseTime ? {
                        passed: responseTimePassed,
                        actual: httpReqDurationP95,
                        expected: config.assertions.responseTime
                    } : undefined,
                    failureRate: config.assertions?.failureRate ? {
                        passed: failureRatePassed,
                        actual: failureRate,
                        expected: config.assertions.failureRate
                    } : undefined
                }
            },
            timestamp: new Date(),
            config,
            rawOutput: output
        };
    }
    /**
     * Extract a metric from k6 output
     */
    extractMetric(output, name, type) {
        const regex = new RegExp(`${name}\\s+:\\s+${type}=([\\d\\.]+)`);
        const match = output.match(regex);
        if (match && match[1]) {
            return parseFloat(match[1]);
        }
        return 0;
    }
    /**
     * Save test results to a file
     */
    async saveResults(result) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const resultPath = path.join(this.outputDir, `load-test-result-${timestamp}.json`);
        await writeFile(resultPath, JSON.stringify(result, null, 2));
    }
};
exports.LoadTestingService = LoadTestingService;
exports.LoadTestingService = LoadTestingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LoadTestingService);
//# sourceMappingURL=load-testing.service.js.map