"use strict";
/**
 * Theia IDE Agentic Integration Types
 *
 * Comprehensive type definitions for Theia IDE integration
 * with The New Fuse AI Agent framework.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TheiaCompletionKind = exports.TheiaOperationStatus = exports.TheiaOperationTrigger = exports.TheiaOperation = exports.TheiaFileType = exports.TheiaSessionStatus = exports.TheiaConnectionType = exports.TheiaAutomationLevel = exports.TheiaProjectType = void 0;
var TheiaProjectType;
(function (TheiaProjectType) {
    TheiaProjectType["GENERAL"] = "GENERAL";
    TheiaProjectType["NODEJS"] = "NODEJS";
    TheiaProjectType["PYTHON"] = "PYTHON";
    TheiaProjectType["REACT"] = "REACT";
    TheiaProjectType["ANGULAR"] = "ANGULAR";
    TheiaProjectType["VUE"] = "VUE";
    TheiaProjectType["RUST"] = "RUST";
    TheiaProjectType["GO"] = "GO";
    TheiaProjectType["JAVA"] = "JAVA";
    TheiaProjectType["CPP"] = "CPP";
    TheiaProjectType["PHP"] = "PHP";
    TheiaProjectType["RUBY"] = "RUBY";
})(TheiaProjectType || (exports.TheiaProjectType = TheiaProjectType = {}));
var TheiaAutomationLevel;
(function (TheiaAutomationLevel) {
    TheiaAutomationLevel["MANUAL"] = "MANUAL";
    TheiaAutomationLevel["ASSISTED"] = "ASSISTED";
    TheiaAutomationLevel["SEMI_AUTO"] = "SEMI_AUTO";
    TheiaAutomationLevel["FULL_AUTO"] = "FULL_AUTO";
})(TheiaAutomationLevel || (exports.TheiaAutomationLevel = TheiaAutomationLevel = {}));
var TheiaConnectionType;
(function (TheiaConnectionType) {
    TheiaConnectionType["HTTP"] = "HTTP";
    TheiaConnectionType["WEBSOCKET"] = "WEBSOCKET";
    TheiaConnectionType["STDIO"] = "STDIO";
    TheiaConnectionType["SSH"] = "SSH";
})(TheiaConnectionType || (exports.TheiaConnectionType = TheiaConnectionType = {}));
var TheiaSessionStatus;
(function (TheiaSessionStatus) {
    TheiaSessionStatus["ACTIVE"] = "ACTIVE";
    TheiaSessionStatus["INACTIVE"] = "INACTIVE";
    TheiaSessionStatus["DISCONNECTED"] = "DISCONNECTED";
    TheiaSessionStatus["EXPIRED"] = "EXPIRED";
})(TheiaSessionStatus || (exports.TheiaSessionStatus = TheiaSessionStatus = {}));
var TheiaFileType;
(function (TheiaFileType) {
    TheiaFileType["SOURCE_CODE"] = "SOURCE_CODE";
    TheiaFileType["CONFIG"] = "CONFIG";
    TheiaFileType["DATA"] = "DATA";
    TheiaFileType["DOCUMENTATION"] = "DOCUMENTATION";
    TheiaFileType["BINARY"] = "BINARY";
    TheiaFileType["UNKNOWN"] = "UNKNOWN";
})(TheiaFileType || (exports.TheiaFileType = TheiaFileType = {}));
var TheiaOperation;
(function (TheiaOperation) {
    TheiaOperation["READ"] = "READ";
    TheiaOperation["WRITE"] = "WRITE";
    TheiaOperation["CREATE"] = "CREATE";
    TheiaOperation["DELETE"] = "DELETE";
    TheiaOperation["RENAME"] = "RENAME";
    TheiaOperation["MOVE"] = "MOVE";
    TheiaOperation["COPY"] = "COPY";
    TheiaOperation["CHMOD"] = "CHMOD";
})(TheiaOperation || (exports.TheiaOperation = TheiaOperation = {}));
var TheiaOperationTrigger;
(function (TheiaOperationTrigger) {
    TheiaOperationTrigger["USER"] = "USER";
    TheiaOperationTrigger["AGENT"] = "AGENT";
    TheiaOperationTrigger["SYSTEM"] = "SYSTEM";
    TheiaOperationTrigger["EXTERNAL"] = "EXTERNAL";
})(TheiaOperationTrigger || (exports.TheiaOperationTrigger = TheiaOperationTrigger = {}));
var TheiaOperationStatus;
(function (TheiaOperationStatus) {
    TheiaOperationStatus["PENDING"] = "PENDING";
    TheiaOperationStatus["COMPLETED"] = "COMPLETED";
    TheiaOperationStatus["FAILED"] = "FAILED";
    TheiaOperationStatus["CANCELLED"] = "CANCELLED";
})(TheiaOperationStatus || (exports.TheiaOperationStatus = TheiaOperationStatus = {}));
var TheiaCompletionKind;
(function (TheiaCompletionKind) {
    TheiaCompletionKind[TheiaCompletionKind["TEXT"] = 1] = "TEXT";
    TheiaCompletionKind[TheiaCompletionKind["METHOD"] = 2] = "METHOD";
    TheiaCompletionKind[TheiaCompletionKind["FUNCTION"] = 3] = "FUNCTION";
    TheiaCompletionKind[TheiaCompletionKind["CONSTRUCTOR"] = 4] = "CONSTRUCTOR";
    TheiaCompletionKind[TheiaCompletionKind["FIELD"] = 5] = "FIELD";
    TheiaCompletionKind[TheiaCompletionKind["VARIABLE"] = 6] = "VARIABLE";
    TheiaCompletionKind[TheiaCompletionKind["CLASS"] = 7] = "CLASS";
    TheiaCompletionKind[TheiaCompletionKind["INTERFACE"] = 8] = "INTERFACE";
    TheiaCompletionKind[TheiaCompletionKind["MODULE"] = 9] = "MODULE";
    TheiaCompletionKind[TheiaCompletionKind["PROPERTY"] = 10] = "PROPERTY";
    TheiaCompletionKind[TheiaCompletionKind["UNIT"] = 11] = "UNIT";
    TheiaCompletionKind[TheiaCompletionKind["VALUE"] = 12] = "VALUE";
    TheiaCompletionKind[TheiaCompletionKind["ENUM"] = 13] = "ENUM";
    TheiaCompletionKind[TheiaCompletionKind["KEYWORD"] = 14] = "KEYWORD";
    TheiaCompletionKind[TheiaCompletionKind["SNIPPET"] = 15] = "SNIPPET";
    TheiaCompletionKind[TheiaCompletionKind["COLOR"] = 16] = "COLOR";
    TheiaCompletionKind[TheiaCompletionKind["FILE"] = 17] = "FILE";
    TheiaCompletionKind[TheiaCompletionKind["REFERENCE"] = 18] = "REFERENCE";
})(TheiaCompletionKind || (exports.TheiaCompletionKind = TheiaCompletionKind = {}));
//# sourceMappingURL=theia-types.js.map