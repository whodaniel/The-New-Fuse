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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenClawRuntimeService = void 0;
const common_1 = require("@nestjs/common");
const node_child_process_1 = require("node:child_process");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const node_util_1 = require("node:util");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
let OpenClawRuntimeService = class OpenClawRuntimeService {
    constructor() {
        this.repoRoot = this.resolveRepoRoot();
        this.scriptPath = path.join(this.repoRoot, 'scripts', 'openclaw', 'tnf-openclaw-control.cjs');
    }
    async listInstances() {
        return this.runScript(['instances', '--json']);
    }
    async getInventory(target = {}) {
        return this.runScript(['overview', '--json', ...this.buildTargetArgs(target)]);
    }
    async getConfig(pathExpression, target = {}) {
        const args = ['config-show', '--json'];
        if (pathExpression)
            args.push('--path', pathExpression);
        args.push(...this.buildTargetArgs(target));
        return this.runScript(args);
    }
    async setConfig(pathExpression, value, valueType = 'string', target = {}) {
        return this.runScript([
            'config-set',
            pathExpression,
            value,
            '--type',
            valueType || 'string',
            '--json',
            ...this.buildTargetArgs(target),
        ]);
    }
    async unsetConfig(pathExpression, target = {}) {
        return this.runScript([
            'config-unset',
            pathExpression,
            '--json',
            ...this.buildTargetArgs(target),
        ]);
    }
    async listCronJobs(target = {}) {
        return this.runScript(['cron-list', '--json', ...this.buildTargetArgs(target)]);
    }
    async enableCronJob(jobReference, target = {}) {
        return this.runScript(['cron-enable', jobReference, '--json', ...this.buildTargetArgs(target)]);
    }
    async disableCronJob(jobReference, target = {}) {
        return this.runScript([
            'cron-disable',
            jobReference,
            '--json',
            ...this.buildTargetArgs(target),
        ]);
    }
    async scheduleCronJob(jobReference, options, target = {}) {
        const args = ['cron-schedule', jobReference, '--json'];
        if (options.cron)
            args.push('--cron', String(options.cron));
        if (options.tz)
            args.push('--tz', String(options.tz));
        if (options.staggerMs != null)
            args.push('--stagger-ms', String(options.staggerMs));
        if (options.everyMs != null)
            args.push('--every-ms', String(options.everyMs));
        if (options.anchorMs != null)
            args.push('--anchor-ms', String(options.anchorMs));
        if (options.at)
            args.push('--at', String(options.at));
        args.push(...this.buildTargetArgs(target));
        return this.runScript(args);
    }
    async syncControlPlane(actorId, target = {}) {
        return this.runScript([
            'sync-control-plane',
            '--json',
            '--actor',
            actorId || 'system',
            ...this.buildTargetArgs(target),
        ]);
    }
    async cleanupCron(actorId, options = {}) {
        const args = ['cleanup-cron', '--json', '--actor', actorId || 'system'];
        if (options.dryRun)
            args.push('--dry-run');
        if (options.disableFailing)
            args.push('--disable-failing');
        if (options.keepLaunchValidationDuplicates)
            args.push('--keep-launch-validation-duplicates');
        args.push(...this.buildTargetArgs(options));
        return this.runScript(args);
    }
    buildTargetArgs(target) {
        const args = [];
        if (target.allInstances)
            args.push('--all-instances');
        if (target.installationId)
            args.push('--installation', String(target.installationId));
        if (target.instanceId)
            args.push('--instance', String(target.instanceId));
        if (target.stateDir)
            args.push('--state-dir', String(target.stateDir));
        return args;
    }
    async runScript(args) {
        try {
            const { stdout } = await execFileAsync('node', [this.scriptPath, ...args], {
                cwd: this.repoRoot,
                timeout: 120000,
                maxBuffer: 1024 * 1024 * 16,
            });
            return JSON.parse(String(stdout || '{}'));
        }
        catch (error) {
            const execError = error;
            const stderr = String(execError.stderr || '').trim();
            const stdout = String(execError.stdout || '').trim();
            const errorPayload = [stderr, stdout]
                .filter(Boolean)
                .map((value) => {
                try {
                    const parsed = JSON.parse(value);
                    return String(parsed.error || parsed.message || value);
                }
                catch {
                    return value;
                }
            })
                .find(Boolean);
            throw new Error(errorPayload || execError.message || 'OpenClaw runtime command failed');
        }
    }
    resolveRepoRoot() {
        const registryRelative = path.join('data', 'protocols', 'cron-jobs.registry.json');
        let current = process.cwd();
        for (let i = 0; i < 8; i += 1) {
            const candidate = path.join(current, registryRelative);
            if (fs.existsSync(candidate))
                return current;
            const next = path.dirname(current);
            if (next === current)
                break;
            current = next;
        }
        return process.cwd();
    }
};
exports.OpenClawRuntimeService = OpenClawRuntimeService;
exports.OpenClawRuntimeService = OpenClawRuntimeService = __decorate([
    (0, common_1.Injectable)()
], OpenClawRuntimeService);
//# sourceMappingURL=openclaw-runtime.service.js.map