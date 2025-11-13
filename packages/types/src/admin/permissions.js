export var Permission;
(function (Permission) {
    // User Management
    Permission["VIEW_USERS"] = "view_users";
    Permission["MANAGE_USERS"] = "manage_users";
    Permission["MANAGE_ROLES"] = "manage_roles";
    // System
    Permission["VIEW_METRICS"] = "view_metrics";
    Permission["VIEW_LOGS"] = "view_logs";
    Permission["MANAGE_SYSTEM"] = "manage_system";
    // Services
    Permission["VIEW_SERVICES"] = "view_services";
    Permission["MANAGE_SERVICES"] = "manage_services";
    // Features
    Permission["MANAGE_FEATURES"] = "manage_features";
    // Scripts
    Permission["RUN_SCRIPTS"] = "run_scripts";
    // Database
    Permission["VIEW_DATABASE"] = "view_database";
    Permission["MANAGE_DATABASE"] = "manage_database";
})(Permission || (Permission = {}));
//# sourceMappingURL=permissions.js.map