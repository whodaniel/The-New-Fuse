export var AuthMethod;
(function (AuthMethod) {
    AuthMethod["PASSWORD"] = "password";
    AuthMethod["OAUTH"] = "oauth";
    AuthMethod["API_KEY"] = "api_key";
    AuthMethod["CERTIFICATE"] = "certificate";
})(AuthMethod || (AuthMethod = {}));
export var AuthRole;
(function (AuthRole) {
    AuthRole["USER"] = "user";
    AuthRole["ADMIN"] = "admin";
    AuthRole["GUEST"] = "guest";
    AuthRole["SYSTEM"] = "system";
})(AuthRole || (AuthRole = {}));
export var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (LogLevel = {}));
//# sourceMappingURL=types.js.map