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
var TNFAutonomousModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TNFAutonomousModule = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const tnf_autonomous_controller_1 = require("../controllers/tnf-autonomous.controller");
const agent_swarm_service_1 = require("./director/agent-swarm.service");
const bmad_service_1 = require("./director/bmad.service");
const director_module_1 = require("./director/director.module");
const director_service_1 = require("./director/director.service");
/**
 * TNF Autonomous Module
 * Main module that wires everything together using the standardized Director components.
 */
let TNFAutonomousModule = TNFAutonomousModule_1 = class TNFAutonomousModule {
    constructor(director, bmad, swarm) {
        this.director = director;
        this.bmad = bmad;
        this.swarm = swarm;
        this.logger = new common_1.Logger(TNFAutonomousModule_1.name);
    }
    async onModuleInit() {
        this.logger.log('═'.repeat(60));
        this.logger.log('   🔮 THE NEW FUSE - AUTONOMOUS SYSTEM');
        this.logger.log('═'.repeat(60));
        this.logger.log('');
        this.logger.log('   Standardized Components:');
        this.logger.log('   ├── DirectorService (Modern Loop with Drizzle + Redis)');
        this.logger.log('   ├── BMADService (Skills→Tools→Context)');
        this.logger.log('   └── AgentSwarmService (Registry & Heartbeat)');
        this.logger.log('');
        this.logger.log('═'.repeat(60) + '\n');
        // Log initial statistics
        const swarmStats = this.swarm.getStatistics();
        const bmadStats = this.bmad.getStatistics();
        const directorStatus = this.director.getStatus();
        this.logger.log(`📊 Current State:`);
        this.logger.log(`   Director: ${directorStatus.isRunning ? 'RUNNING' : 'STOPPED'} (Cycles: ${directorStatus.cycleCount})`);
        this.logger.log(`   BMAD Skills: ${bmadStats.skills}`);
        this.logger.log(`   Swarm Agents: ${swarmStats.totalAgents} (${swarmStats.onlineAgents} online)`);
    }
    /**
     * Get overall system status
     */
    getSystemStatus() {
        return {
            director: this.director.getStatus(),
            bmad: this.bmad.getStatistics(),
            swarm: this.swarm.getStatistics(),
            uptime: process.uptime(),
        };
    }
};
exports.TNFAutonomousModule = TNFAutonomousModule;
exports.TNFAutonomousModule = TNFAutonomousModule = TNFAutonomousModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [event_emitter_1.EventEmitterModule, director_module_1.DirectorModule],
        controllers: [tnf_autonomous_controller_1.TNFAutonomousController],
        exports: [director_module_1.DirectorModule],
    }),
    __metadata("design:paramtypes", [director_service_1.DirectorService,
        bmad_service_1.BMADService,
        agent_swarm_service_1.AgentSwarmService])
], TNFAutonomousModule);
exports.default = TNFAutonomousModule;
//# sourceMappingURL=tnf-autonomous.module.js.map