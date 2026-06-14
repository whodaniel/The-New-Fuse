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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Module
__exportStar(require("./resource-registry.module.js"), exports);
// Services
__exportStar(require("./services/resource-registry.service.js"), exports);
// Controllers
__exportStar(require("./controllers/resource-registry.controller.js"), exports);
// DTOs
__exportStar(require("./dto/create-resource.dto.js"), exports);
__exportStar(require("./dto/search-resource.dto.js"), exports);
__exportStar(require("./dto/update-resource.dto.js"), exports);
// Types
__exportStar(require("./types/index.js"), exports);
//# sourceMappingURL=index.js.map