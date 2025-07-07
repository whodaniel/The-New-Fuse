"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = void 0;
/**
 * Represents system permissions that can be granted to users
 */
var Permission;
(function (Permission) {
    Permission["READ_USERS"] = "READ_USERS";
    Permission["WRITE_USERS"] = "WRITE_USERS";
    Permission["DELETE_USERS"] = "DELETE_USERS";
    Permission["MANAGE_AGENTS"] = "MANAGE_AGENTS";
    Permission["ADMIN_ACCESS"] = "ADMIN_ACCESS";
})(Permission || (exports.Permission = Permission = {}));
