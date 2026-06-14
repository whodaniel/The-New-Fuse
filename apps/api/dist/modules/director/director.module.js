"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectorModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@the-new-fuse/core");
const task_module_1 = require("../task/task.module");
const agent_swarm_service_1 = require("./agent-swarm.service");
const bmad_service_1 = require("./bmad.service");
const director_service_1 = require("./director.service");
let DirectorModule = class DirectorModule {
};
exports.DirectorModule = DirectorModule;
exports.DirectorModule = DirectorModule = __decorate([
    (0, common_1.Module)({
        imports: [task_module_1.TaskModule],
        providers: [director_service_1.DirectorService, bmad_service_1.BMADService, agent_swarm_service_1.AgentSwarmService, core_1.CascadeService],
        exports: [director_service_1.DirectorService, bmad_service_1.BMADService, agent_swarm_service_1.AgentSwarmService],
    })
], DirectorModule);
//# sourceMappingURL=director.module.js.map