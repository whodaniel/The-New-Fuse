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
var DirectorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@the-new-fuse/core");
const ioredis_1 = require("ioredis");
const task_service_1 = require("../task/task.service");
const agent_swarm_service_1 = require("./agent-swarm.service");
const bmad_service_1 = require("./bmad.service");
let DirectorService = DirectorService_1 = class DirectorService {
    constructor(swarmService, bmadService, taskService, cascadeService, configService) {
        this.swarmService = swarmService;
        this.bmadService = bmadService;
        this.taskService = taskService;
        this.cascadeService = cascadeService;
        this.configService = configService;
        this.logger = new common_1.Logger(DirectorService_1.name);
        this.isRunning = false;
        this.cycleCount = 0;
        this.intervalHandle = null;
        this.redis = null;
    }
    async onModuleInit() {
        this.logger.log('🔮 Initializing Director Service...');
        const isEnabled = this.configService.get('DIRECTOR_ENABLED') !== 'false';
        if (!isEnabled) {
            this.logger.log('⏹️ Director Service is DISABLED via configuration');
            return;
        }
        await this.start();
    }
    onModuleDestroy() {
        this.stop();
    }
    async start() {
        if (this.isRunning)
            return;
        // Initialize Redis connection if configured
        const redisUrl = this.configService.get('REDIS_URL');
        if (redisUrl) {
            try {
                this.redis = new ioredis_1.Redis(redisUrl);
                this.redis.on('error', (err) => this.logger.error('Redis error', err));
                this.logger.log('🔗 Redis connected for secondary task discovery');
            }
            catch (error) {
                this.logger.error('❌ Failed to connect to Redis', error);
            }
        }
        this.isRunning = true;
        const interval = this.configService.get('DIRECTOR_CYCLE_INTERVAL') || 60000;
        this.logger.log(`🚀 Director started with ${interval}ms cycle`);
        // Execute first cycle
        await this.executeCycle();
        // Schedule cycles
        this.intervalHandle = setInterval(async () => {
            await this.executeCycle();
        }, interval);
    }
    stop() {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
        if (this.redis) {
            this.redis.quit();
            this.redis = null;
        }
        this.isRunning = false;
        this.logger.log('⏹️ Director stopped');
    }
    async executeCycle() {
        this.cycleCount++;
        const startTime = Date.now();
        try {
            this.logger.log(`🔄 Cycle ${this.cycleCount} starting...`);
            // Phase 1: System Health Check
            const swarmStats = this.swarmService.getStatistics();
            this.logger.log(`📊 Health: ${swarmStats.onlineAgents} agents online`);
            // Phase 2: Task Discovery (Primary: Drizzle, Secondary: Redis)
            const tasks = await this.discoverTasks();
            // Phase 3: Task Execution (via Cascade)
            let executed = 0;
            if (tasks.length > 0) {
                executed = await this.executeTasks(tasks);
            }
            // Phase 4: Self-Reflection & Handoff
            if (this.cycleCount % 5 === 0)
                await this.performReflection();
            if (this.cycleCount % 10 === 0)
                await this.updateHandoff();
            const duration = Date.now() - startTime;
            this.logger.log(`✅ Cycle ${this.cycleCount} completed in ${duration}ms (${executed} tasks handled)`);
        }
        catch (error) {
            this.logger.error(`❌ Cycle ${this.cycleCount} failed:`, error);
        }
    }
    async discoverTasks() {
        const combinedTasks = [];
        // 1. Discover tasks from Drizzle (Modern workflow)
        try {
            const activeTasks = await this.taskService.findActiveTasks();
            activeTasks.forEach((t) => combinedTasks.push({
                id: t.id,
                name: t.title || 'Drizzle Task',
                source: 'database',
                data: t,
            }));
        }
        catch (err) {
            this.logger.error('Failed to discover tasks from Drizzle', err);
        }
        // 2. Discover tasks from Redis (Legacy/Queue workflow)
        if (this.redis) {
            try {
                const redisTask = await this.redis.rpoplpush('task:queue', 'task:processing');
                if (redisTask) {
                    const data = JSON.parse(redisTask);
                    combinedTasks.push({
                        id: data.id,
                        name: data.type || 'Redis Task',
                        source: 'redis',
                        data,
                    });
                }
            }
            catch (err) {
                this.logger.error('Failed to discover tasks from Redis', err);
            }
        }
        return combinedTasks;
    }
    async executeTasks(tasks) {
        const controller = this.cascadeService.createController(`director-cycle-${this.cycleCount}`, core_1.CascadeMode.PARALLEL);
        for (const task of tasks) {
            this.cascadeService.addStep(controller.id, {
                name: task.name,
                handler: async (input, context) => {
                    this.logger.log(`🛠️ Executing ${task.source} task: ${task.id}`);
                    // In actual implementation, this would route to AgentService or a specific Worker
                    return { success: true, taskId: task.id };
                },
            });
        }
        const results = await this.cascadeService.executeController(controller.id, {});
        return Array.isArray(results) ? results.length : 1;
    }
    async performReflection() {
        this.logger.log('🪞 Director performing self-reflection on system performance...');
        const stats = this.bmadService.getStatistics();
        this.logger.log(`   System Stats: ${stats.skills} skills, ${stats.tools} tools initialized`);
    }
    async updateHandoff() {
        this.logger.log('📝 Director updating session handoff data...');
        // Log state for next agent/session
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            cycleCount: this.cycleCount,
            uptime: process.uptime(),
        };
    }
    /**
     * Get swarm activity logs from Redis
     */
    async getSwarmLogs(limit = 50) {
        if (!this.redis)
            return [];
        try {
            const logs = await this.redis.lrange('tnf:master:logs', 0, limit - 1);
            return logs.map((log) => JSON.parse(log));
        }
        catch (error) {
            this.logger.error('Failed to fetch swarm logs from Redis', error);
            return [];
        }
    }
};
exports.DirectorService = DirectorService;
exports.DirectorService = DirectorService = DirectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [agent_swarm_service_1.AgentSwarmService,
        bmad_service_1.BMADService,
        task_service_1.TaskService,
        core_1.CascadeService,
        config_1.ConfigService])
], DirectorService);
//# sourceMappingURL=director.service.js.map