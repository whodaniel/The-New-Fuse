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
exports.setupTestMatchers = setupTestMatchers;
const toBeValidWorkflow_js_1 = require("./toBeValidWorkflow.js");
const toHavePermission_js_1 = require("./toHavePermission.js");
const toMatchAPIContract_js_1 = require("./toMatchAPIContract.js");
const toBeValidComponent_js_1 = require("./toBeValidComponent.js");
const toCompleteWithinTime_js_1 = require("./toCompleteWithinTime.js");
__exportStar(require("./types.js"), exports);
/**
 * Extends Jest's expect with custom matchers for The New Fuse platform
 */
function setupTestMatchers() {
    expect.extend({
        toBeValidWorkflow: toBeValidWorkflow_js_1.toBeValidWorkflow,
        toHavePermission: toHavePermission_js_1.toHavePermission,
        toMatchAPIContract: toMatchAPIContract_js_1.toMatchAPIContract,
        toBeValidComponent: toBeValidComponent_js_1.toBeValidComponent,
        toCompleteWithinTime: toCompleteWithinTime_js_1.toCompleteWithinTime
    });
}
//# sourceMappingURL=index.js.map