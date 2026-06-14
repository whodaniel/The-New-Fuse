var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ThreeFileMemoryPattern_1;
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
let ThreeFileMemoryPattern = ThreeFileMemoryPattern_1 = class ThreeFileMemoryPattern {
    constructor(config) {
        this.logger = new Logger(ThreeFileMemoryPattern_1.name);
        this.initialized = false;
        this.config = config || {
            rootDir: process.cwd(),
            phasesFile: 'phases_progress.md',
            researchFile: 'research_findings.md',
            sessionLogsFile: 'session_logs.md',
        };
    }
    initialize(config) {
        if (config) {
            this.config = { ...this.config, ...config };
        }
        const rootDir = this.config.rootDir;
        if (!fs.existsSync(rootDir)) {
            fs.mkdirSync(rootDir, { recursive: true });
        }
        const files = [
            this.getPhasesPath(),
            this.getResearchPath(),
            this.getSessionLogsPath(),
        ];
        for (const filePath of files) {
            if (!fs.existsSync(filePath)) {
                const header = this.getFileHeader(path.basename(filePath));
                fs.writeFileSync(filePath, header, 'utf-8');
            }
        }
        this.initialized = true;
        this.logger.log(`Three-file memory pattern initialized at ${rootDir}`);
    }
    recordPhase(entry) {
        this.ensureInitialized();
        const filePath = this.getPhasesPath();
        const line = `- **${entry.phase}** [${entry.status}] ${entry.progress}% — ${entry.notes} _(${entry.updatedAt})_\n`;
        fs.appendFileSync(filePath, line, 'utf-8');
        this.logger.debug(`Recorded phase: ${entry.phase}`);
    }
    updatePhase(phase, updates) {
        this.ensureInitialized();
        const filePath = this.getPhasesPath();
        const content = fs.readFileSync(filePath, 'utf-8');
        const regex = new RegExp(`- \\*\\*${phase}\\*\\* \\[\\w+\\] \\d+% — .+ _\\(.+\\)_`);
        if (!regex.test(content))
            return null;
        const updated = {
            phase,
            status: updates.status || 'in_progress',
            progress: updates.progress ?? 0,
            notes: updates.notes || '',
            updatedAt: new Date().toISOString(),
        };
        const newLine = `- **${updated.phase}** [${updated.status}] ${updated.progress}% — ${updated.notes} _(${updated.updatedAt})_`;
        const newContent = content.replace(regex, newLine);
        fs.writeFileSync(filePath, newContent, 'utf-8');
        return updated;
    }
    recordResearch(entry) {
        this.ensureInitialized();
        const filePath = this.getResearchPath();
        const sources = entry.sources.map((s) => `  - ${s}`).join('\n');
        const line = `\n### ${entry.topic}\n${entry.findings}\n\nConfidence: ${entry.confidence}\nSources:\n${sources}\n_Discovered: ${entry.discoveredAt}_\n`;
        fs.appendFileSync(filePath, line, 'utf-8');
        this.logger.debug(`Recorded research: ${entry.topic}`);
    }
    recordSession(entry) {
        this.ensureInitialized();
        const filePath = this.getSessionLogsPath();
        const outcomes = entry.outcomes.map((o) => `  - ${o}`).join('\n');
        const artifacts = entry.artifacts.map((a) => `  - ${a}`).join('\n');
        const line = `\n## Session ${entry.sessionId}\n- Start: ${entry.startTime}\n- End: ${entry.endTime || 'in progress'}\n- Tests: ${entry.testsPassed}/${entry.testsRun} passed, ${entry.testsFailed} failed\n\nOutcomes:\n${outcomes}\n\nArtifacts:\n${artifacts}\n`;
        fs.appendFileSync(filePath, line, 'utf-8');
        this.logger.debug(`Recorded session: ${entry.sessionId}`);
    }
    getPhases() {
        this.ensureInitialized();
        const content = fs.readFileSync(this.getPhasesPath(), 'utf-8');
        const phases = [];
        const regex = /- \*\*(.+?)\*\* \[(\w+)\] (\d+)% — (.+?) _\((.+?)\)_/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            phases.push({
                phase: match[1],
                status: match[2],
                progress: parseInt(match[3], 10),
                notes: match[4],
                updatedAt: match[5],
            });
        }
        return phases;
    }
    getResearch() {
        this.ensureInitialized();
        const content = fs.readFileSync(this.getResearchPath(), 'utf-8');
        const entries = [];
        const sections = content.split(/^### /m).slice(1);
        for (const section of sections) {
            const lines = section.trim().split('\n');
            const topic = lines[0].trim();
            const findings = lines.slice(1).join('\n').trim();
            entries.push({
                topic,
                findings,
                sources: [],
                confidence: 0.5,
                discoveredAt: new Date().toISOString(),
            });
        }
        return entries;
    }
    getSessionLogs() {
        this.ensureInitialized();
        const content = fs.readFileSync(this.getSessionLogsPath(), 'utf-8');
        const sessions = [];
        const sections = content.split(/^## Session /m).slice(1);
        for (const section of sections) {
            const lines = section.trim().split('\n');
            const sessionId = lines[0].trim();
            sessions.push({
                sessionId,
                startTime: new Date().toISOString(),
                testsRun: 0,
                testsPassed: 0,
                testsFailed: 0,
                outcomes: [],
                artifacts: [],
            });
        }
        return sessions;
    }
    getPhasesPath() {
        return path.join(this.config.rootDir, this.config.phasesFile || 'phases_progress.md');
    }
    getResearchPath() {
        return path.join(this.config.rootDir, this.config.researchFile || 'research_findings.md');
    }
    getSessionLogsPath() {
        return path.join(this.config.rootDir, this.config.sessionLogsFile || 'session_logs.md');
    }
    ensureInitialized() {
        if (!this.initialized) {
            this.initialize();
        }
    }
    getFileHeader(filename) {
        const title = filename.replace(/\.md$/, '').replace(/_/g, ' ');
        return `# ${title.charAt(0).toUpperCase() + title.slice(1)}\n\n_Auto-maintained by ThreeFileMemoryPattern_\n\n`;
    }
};
ThreeFileMemoryPattern = ThreeFileMemoryPattern_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object])
], ThreeFileMemoryPattern);
export { ThreeFileMemoryPattern };
//# sourceMappingURL=ThreeFileMemoryPattern.js.map