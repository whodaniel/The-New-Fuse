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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtifactGenerationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util = __importStar(require("util"));
const archiver_1 = __importDefault(require("archiver"));
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const mkdir = util.promisify(fs.mkdir);
let ArtifactGenerationService = class ArtifactGenerationService {
    constructor(configService) {
        this.configService = configService;
        this.config = {
            outputDir: this.configService.get('testing.artifacts.outputDir', 'test-artifacts'),
            createArchive: this.configService.get('testing.artifacts.createArchive', true),
            includeTimestamp: this.configService.get('testing.artifacts.includeTimestamp', true),
            retentionDays: this.configService.get('testing.artifacts.retentionDays', 30)
        };
    }
    /**
     * Save a test artifact
     */
    async saveArtifact(artifact) {
        // Create output directory if it doesn't exist
        const outputDir = path.join(this.config.outputDir, artifact.type);
        await mkdir(outputDir, { recursive: true });
        // Generate filename
        const timestamp = this.config.includeTimestamp ? `-${new Date().toISOString().replace(/:/g, '-')}` : '';
        const filename = `${artifact.name}${timestamp}`;
        const outputPath = path.join(outputDir, filename);
        // Save artifact
        if (Buffer.isBuffer(artifact.content)) {
            await writeFile(outputPath, artifact.content);
        }
        else {
            await writeFile(outputPath, artifact.content);
        }
        // Save metadata if provided
        if (artifact.metadata) {
            await writeFile(`${outputPath}.meta.json`, JSON.stringify(artifact.metadata, null, 2));
        }
        return outputPath;
    }
    /**
     * Save multiple artifacts
     */
    async saveArtifacts(artifacts) {
        const paths = [];
        for (const artifact of artifacts) {
            const path = await this.saveArtifact(artifact);
            paths.push(path);
        }
        return paths;
    }
    /**
     * Create an archive of artifacts
     */
    async createArtifactArchive(name, artifacts, metadata) {
        // Create output directory if it doesn't exist
        await mkdir(this.config.outputDir, { recursive: true });
        // Generate archive filename
        const timestamp = this.config.includeTimestamp ? `-${new Date().toISOString().replace(/:/g, '-')}` : '';
        const archiveName = `${name}${timestamp}.zip`;
        const archivePath = path.join(this.config.outputDir, archiveName);
        // Create archive
        const output = fs.createWriteStream(archivePath);
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        archive.pipe(output);
        // Add artifacts to archive
        for (const artifact of artifacts) {
            if (typeof artifact === 'string') {
                // Artifact is a file path
                archive.file(artifact, { name: path.basename(artifact) });
            }
            else {
                // Artifact is a TestArtifact object
                const content = Buffer.isBuffer(artifact.content)
                    ? artifact.content
                    : Buffer.from(artifact.content);
                archive.append(content, { name: artifact.name });
                if (artifact.metadata) {
                    archive.append(JSON.stringify(artifact.metadata, null, 2), { name: `${artifact.name}.meta.json` });
                }
            }
        }
        // Add metadata if provided
        if (metadata) {
            archive.append(JSON.stringify(metadata, null, 2), { name: 'archive-metadata.json' });
        }
        // Finalize archive
        await archive.finalize();
        return new Promise((resolve, reject) => {
            output.on('close', () => resolve(archivePath));
            archive.on('error', reject);
        });
    }
    /**
     * Clean up old artifacts
     */
    async cleanupOldArtifacts() {
        if (this.config.retentionDays <= 0) {
            return 0; // No cleanup needed
        }
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
        let deletedCount = 0;
        // Recursively find and delete old files
        const deleteOldFiles = async (dir) => {
            const files = await util.promisify(fs.readdir)(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = await util.promisify(fs.stat)(filePath);
                if (stats.isDirectory()) {
                    // Recursively process subdirectories
                    const subDirDeletedCount = await deleteOldFiles(filePath);
                    deletedCount += subDirDeletedCount;
                    // Delete empty directories
                    const remainingFiles = await util.promisify(fs.readdir)(filePath);
                    if (remainingFiles.length === 0) {
                        await util.promisify(fs.rmdir)(filePath);
                    }
                }
                else if (stats.mtime < cutoffDate) {
                    // Delete old files
                    await util.promisify(fs.unlink)(filePath);
                    deletedCount++;
                }
            }
            return deletedCount;
        };
        try {
            if (fs.existsSync(this.config.outputDir)) {
                deletedCount = await deleteOldFiles(this.config.outputDir);
            }
        }
        catch (error) {
            console.error('Error cleaning up old artifacts:', error);
        }
        return deletedCount;
    }
};
exports.ArtifactGenerationService = ArtifactGenerationService;
exports.ArtifactGenerationService = ArtifactGenerationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ArtifactGenerationService);
//# sourceMappingURL=artifact-generation.service.js.map