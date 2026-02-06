'use strict';
/**
 * Types for the Code Execution Service
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ExecutionEnvironment = exports.CodeExecutionLanguage = void 0;
/**
 * Supported programming languages for code execution
 */
var CodeExecutionLanguage;
(function (CodeExecutionLanguage) {
  CodeExecutionLanguage['JAVASCRIPT'] = 'javascript';
  CodeExecutionLanguage['TYPESCRIPT'] = 'typescript';
  CodeExecutionLanguage['PYTHON'] = 'python';
  CodeExecutionLanguage['RUBY'] = 'ruby';
  CodeExecutionLanguage['SHELL'] = 'shell';
  CodeExecutionLanguage['HTML'] = 'html';
  CodeExecutionLanguage['CSS'] = 'css';
})(CodeExecutionLanguage || (exports.CodeExecutionLanguage = CodeExecutionLanguage = {}));
/**
 * Execution environments for code execution
 */
var ExecutionEnvironment;
(function (ExecutionEnvironment) {
  ExecutionEnvironment['SANDBOX'] = 'sandbox';
  ExecutionEnvironment['CONTAINER'] = 'container';
  ExecutionEnvironment['CLOUDFLARE_WORKER'] = 'cloudflare-worker';
})(ExecutionEnvironment || (exports.ExecutionEnvironment = ExecutionEnvironment = {}));
//# sourceMappingURL=types.js.map
