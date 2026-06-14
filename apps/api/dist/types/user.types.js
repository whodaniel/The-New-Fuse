"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    // Core roles
    UserRole["USER"] = "user";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
    // Agent roles
    UserRole["AGENT"] = "agent";
    UserRole["SYSTEM"] = "system";
    // Agency roles (white-label multi-tenant)
    UserRole["AGENCY_OWNER"] = "agency_owner";
    UserRole["AGENCY_ADMIN"] = "agency_admin";
    UserRole["AGENCY_MANAGER"] = "agency_manager";
    UserRole["AGENT_OPERATOR"] = "agent_operator";
})(UserRole || (exports.UserRole = UserRole = {}));
//# sourceMappingURL=user.types.js.map