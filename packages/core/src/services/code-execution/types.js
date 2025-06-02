"use strict";
/**
 * Types for the Code Execution Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeExecutionTier = exports.CodeExecutionLanguage = void 0;
/**
 * Supported programming languages for code execution
 */
var CodeExecutionLanguage;
(function (CodeExecutionLanguage) {
    CodeExecutionLanguage["JAVASCRIPT"] = "javascript";
    CodeExecutionLanguage["TYPESCRIPT"] = "typescript";
    CodeExecutionLanguage["PYTHON"] = "python";
    CodeExecutionLanguage["SHELL"] = "shell";
    CodeExecutionLanguage["HTML"] = "html";
    CodeExecutionLanguage["CSS"] = "css";
})(CodeExecutionLanguage || (exports.CodeExecutionLanguage = CodeExecutionLanguage = {}));
/**
 * Billing tier for code execution
 */
var CodeExecutionTier;
(function (CodeExecutionTier) {
    CodeExecutionTier["BASIC"] = "basic";
    CodeExecutionTier["STANDARD"] = "standard";
    CodeExecutionTier["PREMIUM"] = "premium";
})(CodeExecutionTier || (exports.CodeExecutionTier = CodeExecutionTier = {}));
//# sourceMappingURL=types.js.map