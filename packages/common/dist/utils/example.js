"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleUtil = exampleUtil;
exports.formatDate = formatDate;
exports.generateId = generateId;
function exampleUtil(input) {
    return `${input}-processed`;
}
function formatDate(date) {
    return date.toISOString();
}
function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
//# sourceMappingURL=example.js.map