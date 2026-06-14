"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHavePermission = void 0;
const utils_js_1 = require("./utils.js");
exports.toHavePermission = (0, utils_js_1.createMatcher)((received, permission) => {
    // Check direct permissions
    if (received.permissions?.includes(permission)) {
        return true;
    }
    // Check role-based permissions
    return received.roles?.some(role => role.permissions.includes(permission)) ?? false;
}, (received, permission) => `Expected user ${received.id} to have permission "${permission}", but they don't`, (received, permission) => `Expected user ${received.id} not to have permission "${permission}", but they do`);
//# sourceMappingURL=toHavePermission.js.map