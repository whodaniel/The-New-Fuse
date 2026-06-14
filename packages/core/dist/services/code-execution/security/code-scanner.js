var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CodeScanner_1;
/**
 * Code Scanner for detecting malicious code patterns
 */
import { Injectable, Logger } from '@nestjs/common';
export var SecurityIssueType;
(function (SecurityIssueType) {
    SecurityIssueType["MALICIOUS_CODE"] = "Malicious Code";
    SecurityIssueType["RESOURCE_EXHAUSTION"] = "Resource Exhaustion";
    SecurityIssueType["DATA_EXFILTRATION"] = "Data Exfiltration";
    SecurityIssueType["PRIVILEGE_ESCALATION"] = "Privilege Escalation";
    SecurityIssueType["SANDBOX_ESCAPE"] = "Sandbox Escape";
    SecurityIssueType["UNSAFE_IMPORT"] = "Unsafe Import";
})(SecurityIssueType || (SecurityIssueType = {}));
export var SecurityIssueSeverity;
(function (SecurityIssueSeverity) {
    SecurityIssueSeverity["LOW"] = "Low";
    SecurityIssueSeverity["MEDIUM"] = "Medium";
    SecurityIssueSeverity["HIGH"] = "High";
    SecurityIssueSeverity["CRITICAL"] = "Critical";
})(SecurityIssueSeverity || (SecurityIssueSeverity = {}));
let CodeScanner = CodeScanner_1 = class CodeScanner {
    constructor() {
        this.logger = new Logger(CodeScanner_1.name);
        this.rules = [
            {
                type: SecurityIssueType.UNSAFE_IMPORT,
                severity: SecurityIssueSeverity.HIGH,
                pattern: /require\s*\(\s*['"](fs|child_process|vm)['"]\s*\)/g,
                description: 'Unsafe module import detected.',
            },
            {
                type: SecurityIssueType.MALICIOUS_CODE,
                severity: SecurityIssueSeverity.CRITICAL,
                pattern: /eval\s*\(|new Function\s*\(/g,
                description: 'Execution of arbitrary code using eval() or new Function() is unsafe.',
            },
            {
                type: SecurityIssueType.RESOURCE_EXHAUSTION,
                severity: SecurityIssueSeverity.MEDIUM,
                pattern: /while\s*\(\s*true\s*\)/g,
                description: 'Infinite loop detected, which can lead to resource exhaustion.',
            },
        ];
    }
    scan(code) {
        const issues = [];
        for (const rule of this.rules) {
            let match;
            while ((match = rule.pattern.exec(code)) !== null) {
                const lineNumber = this.getLineNumber(code, match.index);
                issues.push({
                    type: rule.type,
                    severity: rule.severity,
                    description: rule.description,
                    lineNumber,
                });
            }
        }
        return issues;
    }
    getLineNumber(code, index) {
        return code.substring(0, index).split('\n').length;
    }
};
CodeScanner = CodeScanner_1 = __decorate([
    Injectable()
], CodeScanner);
export { CodeScanner };
//# sourceMappingURL=code-scanner.js.map