"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var ArtifactValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtifactValidationService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let ArtifactValidationService = ArtifactValidationService_1 = class ArtifactValidationService {
    constructor() {
        this.logger = new common_1.Logger(ArtifactValidationService_1.name);
    }
    validateFile(filePath) {
        const resolved = path.resolve(filePath);
        const result = {
            filePath: resolved,
            exists: false,
            size: 0,
            lastModified: null,
            extension: path.extname(resolved).slice(1),
            mimeType: null,
        };
        try {
            const stat = fs.statSync(resolved);
            result.exists = true;
            result.size = stat.size;
            result.lastModified = stat.mtime.toISOString();
            result.mimeType = this.inferMimeType(result.extension);
        }
        catch {
            result.exists = false;
        }
        return result;
    }
    validateDirectory(dirPath, pattern) {
        const resolved = path.resolve(dirPath);
        const results = [];
        try {
            const entries = fs.readdirSync(resolved, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile()) {
                    if (pattern && !pattern.test(entry.name))
                        continue;
                    results.push(this.validateFile(path.join(resolved, entry.name)));
                }
            }
        }
        catch {
            this.logger.warn(`Directory not found or unreadable: ${resolved}`);
        }
        return {
            validated: results.length,
            found: results.filter((r) => r.exists).length,
            missing: results.filter((r) => !r.exists).length,
            results,
        };
    }
    validateBatch(filePaths) {
        const results = filePaths.map((fp) => this.validateFile(fp));
        return {
            validated: results.length,
            found: results.filter((r) => r.exists).length,
            missing: results.filter((r) => !r.exists).length,
            results,
        };
    }
    validateWithConstraints(filePath, constraints) {
        const result = this.validateFile(filePath);
        const violations = [];
        if (!result.exists) {
            violations.push('File does not exist');
        }
        if (constraints.minSize && result.size < constraints.minSize) {
            violations.push(`File size ${result.size} below minimum ${constraints.minSize}`);
        }
        if (constraints.maxSize && result.size > constraints.maxSize) {
            violations.push(`File size ${result.size} above maximum ${constraints.maxSize}`);
        }
        if (constraints.allowedExtensions && !constraints.allowedExtensions.includes(result.extension)) {
            violations.push(`Extension '${result.extension}' not in allowed: ${constraints.allowedExtensions.join(', ')}`);
        }
        if (constraints.modifiedAfter && result.lastModified) {
            if (new Date(result.lastModified) < new Date(constraints.modifiedAfter)) {
                violations.push(`Last modified ${result.lastModified} is before ${constraints.modifiedAfter}`);
            }
        }
        return { ...result, valid: violations.length === 0, violations };
    }
    findGeneratedArtifacts(rootDir, artifactPatterns) {
        const resolved = path.resolve(rootDir);
        const allFiles = [];
        const walk = (dir) => {
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
                        walk(fullPath);
                    }
                    else if (entry.isFile()) {
                        for (const pattern of artifactPatterns) {
                            if (entry.name.includes(pattern) || new RegExp(pattern).test(entry.name)) {
                                allFiles.push(fullPath);
                                break;
                            }
                        }
                    }
                }
            }
            catch {
                // skip unreadable directories
            }
        };
        walk(resolved);
        return this.validateBatch(allFiles);
    }
    inferMimeType(extension) {
        const mimeMap = {
            ts: 'text/typescript',
            tsx: 'text/typescript',
            js: 'text/javascript',
            jsx: 'text/javascript',
            json: 'application/json',
            md: 'text/markdown',
            sql: 'application/sql',
            yaml: 'text/yaml',
            yml: 'text/yaml',
            pdf: 'application/pdf',
            png: 'image/png',
            jpg: 'image/jpeg',
            svg: 'image/svg+xml',
        };
        return mimeMap[extension] || null;
    }
};
exports.ArtifactValidationService = ArtifactValidationService;
exports.ArtifactValidationService = ArtifactValidationService = ArtifactValidationService_1 = __decorate([
    (0, common_1.Injectable)()
], ArtifactValidationService);
//# sourceMappingURL=artifactValidationService.js.map