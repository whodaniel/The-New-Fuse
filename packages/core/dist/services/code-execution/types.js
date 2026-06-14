/**
 * Types for the Code Execution Service
 */
/**
 * Supported programming languages for code execution
 */
export var CodeExecutionLanguage;
(function (CodeExecutionLanguage) {
    CodeExecutionLanguage["JAVASCRIPT"] = "javascript";
    CodeExecutionLanguage["TYPESCRIPT"] = "typescript";
    CodeExecutionLanguage["PYTHON"] = "python";
    CodeExecutionLanguage["RUBY"] = "ruby";
    CodeExecutionLanguage["SHELL"] = "shell";
    CodeExecutionLanguage["HTML"] = "html";
    CodeExecutionLanguage["CSS"] = "css";
})(CodeExecutionLanguage || (CodeExecutionLanguage = {}));
/**
 * Execution environments for code execution
 */
export var ExecutionEnvironment;
(function (ExecutionEnvironment) {
    ExecutionEnvironment["SANDBOX"] = "sandbox";
    ExecutionEnvironment["CONTAINER"] = "container";
    ExecutionEnvironment["CLOUDFLARE_WORKER"] = "cloudflare-worker";
})(ExecutionEnvironment || (ExecutionEnvironment = {}));
//# sourceMappingURL=types.js.map