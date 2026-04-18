"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ap2ProtocolModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const ap2_protocol_service_js_1 = require("./ap2-protocol.service.js");
const ap2_protocol_controller_js_1 = require("./ap2-protocol.controller.js");
let Ap2ProtocolModule = class Ap2ProtocolModule {
};
exports.Ap2ProtocolModule = Ap2ProtocolModule;
exports.Ap2ProtocolModule = Ap2ProtocolModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
        providers: [ap2_protocol_service_js_1.Ap2ProtocolService],
        controllers: [ap2_protocol_controller_js_1.Ap2ProtocolController],
        exports: [ap2_protocol_service_js_1.Ap2ProtocolService],
    })
], Ap2ProtocolModule);
//# sourceMappingURL=ap2-protocol.module.js.map