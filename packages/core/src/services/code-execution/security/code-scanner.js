"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeScanner = exports.SecurityIssueSeverity = exports.SecurityIssueType = void 0;
/**
 * Code Scanner for detecting malicious code patterns
 */
const common_1 = require("@nestjs/common");
const types_js_1 = require("../types.js");
/**
 * Type of security issue
 */
var SecurityIssueType;
(function (SecurityIssueType) {
    SecurityIssueType["MALICIOUS_CODE"] = "malicious_code";
    SecurityIssueType["RESOURCE_EXHAUSTION"] = "resource_exhaustion";
    SecurityIssueType["DATA_EXFILTRATION"] = "data_exfiltration";
    SecurityIssueType["PRIVILEGE_ESCALATION"] = "privilege_escalation";
    SecurityIssueType["SANDBOX_ESCAPE"] = "sandbox_escape";
    SecurityIssueType["UNSAFE_IMPORT"] = "unsafe_import";
})(SecurityIssueType || (exports.SecurityIssueType = SecurityIssueType = {}));
/**
 * Severity of security issue
 */
var SecurityIssueSeverity;
(function (SecurityIssueSeverity) {
    SecurityIssueSeverity["LOW"] = "low";
    SecurityIssueSeverity["MEDIUM"] = "medium";
    SecurityIssueSeverity["HIGH"] = "high";
    SecurityIssueSeverity["CRITICAL"] = "critical";
})(SecurityIssueSeverity || (exports.SecurityIssueSeverity = SecurityIssueSeverity = {}));
/**
 * Code Scanner Service
 */
let CodeScanner = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CodeScanner = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CodeScanner = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        logger = new common_1.Logger(CodeScanner.name);
        // Patterns to detect in JavaScript/TypeScript code
        jsPatterns = [
            {
                pattern: /process\s*\.\s*(exit|kill)/g,
                type: SecurityIssueType.PRIVILEGE_ESCALATION,
                description: 'Attempt to exit the process',
                severity: SecurityIssueSeverity.HIGH,
            },
            {
                pattern: /require\s*\(\s*['"]child_process['"]\s*\)/g,
                type: SecurityIssueType.PRIVILEGE_ESCALATION,
                description: 'Attempt to import child_process module',
                severity: SecurityIssueSeverity.HIGH,
            },
            {
                pattern: /exec|spawn|execSync|spawnSync/g,
                type: SecurityIssueType.PRIVILEGE_ESCALATION,
                description: 'Attempt to execute system commands',
                severity: SecurityIssueSeverity.HIGH,
            },
            {
                pattern: /fs\s*\.\s*(readFile|writeFile|appendFile|readFileSync|writeFileSync|appendFileSync)/g,
                type: SecurityIssueType.DATA_EXFILTRATION,
                description: 'Attempt to access file system',
                severity: SecurityIssueSeverity.MEDIUM,
            },
            {
                pattern: /net|http|https|request|fetch|XMLHttpRequest/g,
                type: SecurityIssueType.DATA_EXFILTRATION,
                description: 'Attempt to make network requests',
                severity: SecurityIssueSeverity.MEDIUM,
            },
            {
                pattern: /while\s*\(\s*true\s*\)|for\s*\(\s*;;\s*\)/g,
                type: SecurityIssueType.RESOURCE_EXHAUSTION,
                description: 'Infinite loop detected',
                severity: SecurityIssueSeverity.HIGH,
            },
            {
                pattern: /new\s+Array\s*\(\s*1e9\s*\)/g,
                type: SecurityIssueType.RESOURCE_EXHAUSTION,
                description: 'Attempt to allocate excessive memory',
                severity: SecurityIssueSeverity.HIGH,
            },
            {
                pattern: /eval|Function\s*\(/g,
                type: SecurityIssueType.SANDBOX_ESCAPE,
                description: 'Attempt to use eval or Function constructor',
                severity: SecurityIssueSeverity.HIGH,
            },
            {
                pattern: /constructor\s*\.\s*constructor|__proto__|prototype|Object\s*\.\s*setPrototypeOf/g,
                type: SecurityIssueType.SANDBOX_ESCAPE,
                description: 'Attempt to modify object prototypes',
                severity: SecurityIssueSeverity.HIGH,
            },
        ];
        // Patterns to detect in Python code
        pythonPatterns = [
            {
                pattern: /import\s+os|from\s+os\s+import/g,
                type: SecurityIssueType.PRIVILEGE_ESCALATION,
                description: 'Attempt to import os module',
                severity: SecurityIssueSeverity.MEDIUM,
            },
            {
                pattern: /import\s+subprocess|from\s+subprocess\s+import/g,
                type: SecurityIssueType.PRIVILEGE_ESCALATION,
                description: 'Attempt to import subprocess module',
                severity: SecurityIssueSeverity.HIGH,
            },
            {
                pattern: /import\s+sys|from\s+sys\s+import/g,
                type: SecurityIssueType.PRIVILEGE_ESCALATION,
                description: 'Attempt to import sys module',
                severity: SecurityIssueSeverity.MEDIUM,
            },
            {
                pattern: /open\s*\(/g,
                type: SecurityIssueType.DATA_EXFILTRATION,
                description: 'Attempt to open files',
                severity: SecurityIssueSeverity.MEDIUM,
            },
            {
                pattern: /exec\s*\(|eval\s*\(/g,
                type: SecurityIssueType.SANDBOX_ESCAPE,
                description: 'Attempt to use exec or eval',
                severity: SecurityIssueSeverity.HIGH,
            },
            {
                pattern: /while\s+True:|for\s+i\s+in\s+range\s*\(\s*10\s*\*\*\s*10\s*\)/g,
                type: SecurityIssueType.RESOURCE_EXHAUSTION,
                description: 'Potential infinite loop or excessive iteration',
                severity: SecurityIssueSeverity.HIGH,
            },
        ];
        // Patterns to detect in Ruby code
        rubyPatterns = [
            {
                pattern: /`.*`|\%x\{.*\}|system\s*\(/g,
                type: SecurityIssueType.PRIVILEGE_ESCALATION,
                description: 'Attempt to execute system commands',
                severity: SecurityIssueSeverity.HIGH,
            },
            {
                pattern: /File\s*\.\s*(read|write|open)/g,
                type: SecurityIssueType.DATA_EXFILTRATION,
                description: 'Attempt to access file system',
                severity: SecurityIssueSeverity.MEDIUM,
            },
            {
                pattern: /eval|instance_eval|class_eval/g,
                type: SecurityIssueType.SANDBOX_ESCAPE,
                description: 'Attempt to use eval',
                severity: SecurityIssueSeverity.HIGH,
            },
            {
                pattern: /while\s+true|loop\s+do/g,
                type: SecurityIssueType.RESOURCE_EXHAUSTION,
                description: 'Infinite loop detected',
                severity: SecurityIssueSeverity.HIGH,
            },
        ];
        // Patterns to detect in Shell code
        shellPatterns = [
            {
                pattern: /rm\s+-rf\s+\/|rm\s+--no-preserve-root/g,
                type: SecurityIssueType.MALICIOUS_CODE,
                description: 'Attempt to delete system files',
                severity: SecurityIssueSeverity.CRITICAL,
            },
            {
                pattern: />\s*\/dev\/sda|dd\s+if=.*of=\/dev\/sda/g,
                type: SecurityIssueType.MALICIOUS_CODE,
                description: 'Attempt to overwrite disk',
                severity: SecurityIssueSeverity.CRITICAL,
            },
            {
                pattern: /:\(\)\{\s*:\|\:&\s*\};:/g,
                type: SecurityIssueType.RESOURCE_EXHAUSTION,
                description: 'Fork bomb detected',
                severity: SecurityIssueSeverity.CRITICAL,
            },
        ];
        /**
         * Scan code for security issues
         * @param code Code to scan
         * @param language Programming language
         * @returns Security scan result
         */
        scanCode(code, language) {
            this.logger.log(`Scanning ${language} code for security issues`);
            const issues = [];
            // Select patterns based on language
            let patterns = [];
            switch (language) {
                case types_js_1.CodeExecutionLanguage.JAVASCRIPT:
                case types_js_1.CodeExecutionLanguage.TYPESCRIPT:
                    patterns = this.jsPatterns;
                    break;
                case types_js_1.CodeExecutionLanguage.PYTHON:
                    patterns = this.pythonPatterns;
                    break;
                case types_js_1.CodeExecutionLanguage.RUBY:
                    patterns = this.rubyPatterns;
                    break;
                case types_js_1.CodeExecutionLanguage.SHELL:
                    patterns = this.shellPatterns;
                    break;
                default:
                    // For other languages, use a subset of JavaScript patterns
                    patterns = this.jsPatterns.filter(p => p.type === SecurityIssueType.RESOURCE_EXHAUSTION ||
                        p.type === SecurityIssueType.SANDBOX_ESCAPE);
            }
            // Check each pattern
            for (const pattern of patterns) {
                const matches = code.match(pattern.pattern);
                if (matches) {
                    // Find line and column for each match
                    for (const match of matches) {
                        const index = code.indexOf(match);
                        const lines = code.substring(0, index).split('\n');
                        const line = lines.length;
                        const column = lines[lines.length - 1].length + 1;
                        issues.push({
                            type: pattern.type,
                            description: pattern.description,
                            severity: pattern.severity,
                            line,
                            column,
                        });
                    }
                }
            }
            // Check for critical issues
            const hasCriticalIssues = issues.some(issue => issue.severity === SecurityIssueSeverity.CRITICAL);
            // Check for high severity issues
            const hasHighSeverityIssues = issues.some(issue => issue.severity === SecurityIssueSeverity.HIGH);
            // Determine if code is safe to execute
            const safe = !hasCriticalIssues && !hasHighSeverityIssues;
            this.logger.log(`Security scan complete: ${issues.length} issues found, safe=${safe}`);
            return {
                safe,
                issues,
            };
        }
    };
    return CodeScanner = _classThis;
})();
exports.CodeScanner = CodeScanner;
//# sourceMappingURL=code-scanner.js.map