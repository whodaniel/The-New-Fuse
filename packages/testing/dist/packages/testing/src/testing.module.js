"use strict";
// Testing Module - NestJS module configuration for automated testing suite
// Integrates test runner service and controller with dependencies
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestingModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const test_runner_service_1 = require("./test-runner.service");
const test_runner_controller_1 = require("./test-runner.controller");
const load_testing_service_1 = require("./load-testing/load-testing.service");
const artifact_generation_service_1 = require("./artifacts/artifact-generation.service");
// TODO: Add CacheModule, QueueModule, WebSocketModule, A2AModule when ready
let TestingModule = class TestingModule {
};
exports.TestingModule = TestingModule;
exports.TestingModule = TestingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
        ],
        controllers: [test_runner_controller_1.TestRunnerController],
        providers: [
            test_runner_service_1.TestRunnerService,
            load_testing_service_1.LoadTestingService,
            artifact_generation_service_1.ArtifactGenerationService,
        ],
        exports: [
            test_runner_service_1.TestRunnerService,
            load_testing_service_1.LoadTestingService,
            artifact_generation_service_1.ArtifactGenerationService,
        ],
    })
], TestingModule);
//# sourceMappingURL=testing.module.js.map