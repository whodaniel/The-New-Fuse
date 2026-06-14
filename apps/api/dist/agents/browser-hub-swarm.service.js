"use strict";
/**
 * Browser Hub Improvement Agent Swarm
 *
 * A coordinated team of specialized self-improving agents focused on
 * making the Browser Hub Electron App world-class in all aspects.
 *
 * AGENTS:
 * 1. UI/UX Agent - Design, layout, user experience
 * 2. Extension Agent - Chrome extension handling, toolbar, management
 * 3. Integration Agent - System synergy, API connections, data flow
 * 4. Brand Agent - TNF design system compliance (uses existing service)
 * 5. Code Quality Agent - Architecture, performance, maintainability
 */
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
var BrowserHubSwarmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserHubSwarmService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
// @ts-ignore
const database_1 = require("@the-new-fuse/database");
// ========================== BASE AGENT ==========================
class BrowserHubAgent {
    constructor(agentId, agentName, capabilities) {
        this.agentId = agentId;
        this.agentName = agentName;
        this.capabilities = capabilities;
        this.issues = [];
        this.suggestions = [];
        this.iteration = 0;
        this.score = 0;
        this.logger = new common_1.Logger(agentName);
    }
    getReport() {
        return {
            agentId: this.agentId,
            agentName: this.agentName,
            timestamp: new Date(),
            issues: this.issues,
            suggestions: this.suggestions,
            score: this.score,
            iteration: this.iteration,
        };
    }
}
// ========================== UI/UX AGENT ==========================
class UIUXAgent extends BrowserHubAgent {
    constructor() {
        super('uiux-agent', 'UIUXGuardian', [
            {
                name: 'layout-analysis',
                description: 'Analyze component layout and hierarchy',
                priority: 'high',
            },
            {
                name: 'responsiveness',
                description: 'Check responsive design implementation',
                priority: 'high',
            },
            {
                name: 'accessibility',
                description: 'Verify accessibility standards (a11y)',
                priority: 'critical',
            },
            {
                name: 'interaction-design',
                description: 'Evaluate user interaction patterns',
                priority: 'medium',
            },
        ]);
    }
    async analyze(codebase) {
        this.iteration++;
        this.issues = [];
        this.suggestions = [];
        for (const [filePath, code] of codebase.entries()) {
            // Check for toolbar implementation issues
            if (filePath.includes('toolbar') || code.includes('toolbar')) {
                this.checkToolbarIssues(filePath, code);
            }
            // Check for button styling issues
            if (code.includes('<button') || code.includes('Button')) {
                this.checkButtonIssues(filePath, code);
            }
            // Check layout containers
            if (code.includes('flex') || code.includes('grid')) {
                this.checkLayoutIssues(filePath, code);
            }
            // Check z-index and layering
            if (code.includes('z-index') || code.includes('zIndex')) {
                this.checkZIndexIssues(filePath, code);
            }
        }
        this.calculateScore();
        this.generateSuggestions();
        return this.getReport();
    }
    checkToolbarIssues(filePath, code) {
        // Check if toolbar has overflow handling
        if (!code.includes('overflow-x') && !code.includes('overflowX')) {
            this.issues.push({
                id: `ui-toolbar-overflow-${Date.now()}`,
                type: 'layout',
                severity: 'major',
                description: 'Extension toolbar missing horizontal overflow handling',
                location: filePath,
                suggestedFix: 'Add overflow-x: auto for horizontal scrolling',
                status: 'open',
            });
        }
        // Check if toolbar items have consistent sizing
        if (!code.includes('flex-shrink-0') && !code.includes('flexShrink: 0')) {
            this.issues.push({
                id: `ui-toolbar-sizing-${Date.now()}`,
                type: 'layout',
                severity: 'minor',
                description: 'Toolbar items may shrink unexpectedly',
                location: filePath,
                suggestedFix: 'Add flex-shrink-0 to prevent icon squishing',
                status: 'open',
            });
        }
    }
    checkButtonIssues(filePath, code) {
        // Check for missing click handlers
        const buttonMatches = code.match(/<button[^>]*>/g) || [];
        for (const match of buttonMatches) {
            if (!match.includes('onClick') && !match.includes('on:click')) {
                this.issues.push({
                    id: `ui-button-handler-${Date.now()}-${Math.random()}`,
                    type: 'interaction',
                    severity: 'major',
                    description: 'Button missing click handler',
                    location: filePath,
                    suggestedFix: 'Add onClick handler for button functionality',
                    status: 'open',
                });
            }
        }
        // Check for accessibility
        if (!code.includes('aria-label') && !code.includes('aria-labelledby')) {
            this.issues.push({
                id: `ui-button-a11y-${Date.now()}`,
                type: 'accessibility',
                severity: 'major',
                description: 'Buttons missing ARIA labels for accessibility',
                location: filePath,
                suggestedFix: 'Add aria-label attribute to all buttons',
                status: 'open',
            });
        }
    }
    checkLayoutIssues(filePath, code) {
        // Check for proper flexbox implementation
        if (code.includes('display: flex') || code.includes('display:flex')) {
            if (!code.includes('align-items') && !code.includes('alignItems')) {
                this.issues.push({
                    id: `ui-layout-align-${Date.now()}`,
                    type: 'layout',
                    severity: 'minor',
                    description: 'Flex container missing explicit align-items',
                    location: filePath,
                    suggestedFix: 'Add align-items: center for vertical centering',
                    status: 'open',
                });
            }
        }
    }
    checkZIndexIssues(filePath, code) {
        // Check for z-index conflicts
        const zIndexMatches = code.match(/z-?[iI]ndex[:\s]+(\d+)/g) || [];
        const values = zIndexMatches.map((m) => parseInt(m.match(/\d+/)?.[0] || '0'));
        if (values.some((v) => v > 1000)) {
            this.issues.push({
                id: `ui-zindex-high-${Date.now()}`,
                type: 'layout',
                severity: 'minor',
                description: 'Excessively high z-index values detected',
                location: filePath,
                suggestedFix: 'Create z-index scale (10, 20, 30...) instead of arbitrary large values',
                status: 'open',
            });
        }
    }
    calculateScore() {
        const criticalIssues = this.issues.filter((i) => i.severity === 'critical').length;
        const majorIssues = this.issues.filter((i) => i.severity === 'major').length;
        const minorIssues = this.issues.filter((i) => i.severity === 'minor').length;
        this.score = Math.max(0, 100 - criticalIssues * 20 - majorIssues * 8 - minorIssues * 2);
    }
    generateSuggestions() {
        if (this.issues.some((i) => i.type === 'layout')) {
            this.suggestions.push('Consider implementing a CSS Grid for the main layout with explicit areas');
        }
        if (this.issues.some((i) => i.type === 'accessibility')) {
            this.suggestions.push('Add comprehensive ARIA labels and keyboard navigation support');
        }
        if (this.score < 80) {
            this.suggestions.push('Implement a design system with reusable components');
        }
    }
    async generateFixes() {
        const fixes = new Map();
        // Generate fix suggestions as code patches
        return fixes;
    }
}
// ========================== EXTENSION AGENT ==========================
class ExtensionAgent extends BrowserHubAgent {
    constructor() {
        super('extension-agent', 'ExtensionMaster', [
            {
                name: 'extension-loading',
                description: 'Verify extension loading mechanisms',
                priority: 'critical',
            },
            {
                name: 'toolbar-integration',
                description: 'Check toolbar icon rendering',
                priority: 'critical',
            },
            { name: 'popup-handling', description: 'Verify extension popup behavior', priority: 'high' },
            {
                name: 'permission-management',
                description: 'Check permission handling',
                priority: 'medium',
            },
        ]);
    }
    async analyze(codebase) {
        this.iteration++;
        this.issues = [];
        this.suggestions = [];
        // Find main.ts for extension handling
        for (const [filePath, code] of codebase.entries()) {
            if (filePath.includes('main.ts') || filePath.includes('main.js')) {
                this.checkExtensionLoading(filePath, code);
                this.checkExtensionIPC(filePath, code);
            }
            if (filePath.includes('preload')) {
                this.checkPreloadExposure(filePath, code);
            }
            if (filePath.includes('html') || filePath.includes('.tsx')) {
                this.checkToolbarRendering(filePath, code);
            }
        }
        this.calculateScore();
        this.generateSuggestions();
        return this.getReport();
    }
    checkExtensionLoading(filePath, code) {
        // Check for proper extension error handling
        if (code.includes('loadExtension') && !code.includes('try') && !code.includes('catch')) {
            this.issues.push({
                id: `ext-error-handling-${Date.now()}`,
                type: 'extension-loading',
                severity: 'major',
                description: 'Extension loading missing error handling',
                location: filePath,
                suggestedFix: 'Wrap extension loading in try-catch with user feedback',
                status: 'open',
            });
        }
        // Check for extension path validation
        if (code.includes('loadExtension') &&
            !code.includes('existsSync') &&
            !code.includes('exists')) {
            this.issues.push({
                id: `ext-path-validation-${Date.now()}`,
                type: 'extension-loading',
                severity: 'minor',
                description: 'Extension path not validated before loading',
                location: filePath,
                suggestedFix: 'Check if extension directory exists before loading',
                status: 'open',
            });
        }
    }
    checkExtensionIPC(filePath, code) {
        // Check for proper IPC handler implementation
        const ipcHandlers = [
            'extensions:get-loaded',
            'extensions:load-unpacked',
            'extensions:install-from-store',
        ];
        for (const handler of ipcHandlers) {
            if (!code.includes(handler)) {
                this.issues.push({
                    id: `ext-ipc-missing-${handler}-${Date.now()}`,
                    type: 'ipc',
                    severity: 'critical',
                    description: `Missing IPC handler: ${handler}`,
                    location: filePath,
                    suggestedFix: `Implement ipcMain.handle('${handler}', ...)`,
                    status: 'open',
                });
            }
        }
    }
    checkPreloadExposure(filePath, code) {
        // Check for proper API exposure
        const requiredAPIs = [
            'getLoadedExtensions',
            'loadUnpackedExtension',
            'installExtensionFromStore',
        ];
        for (const api of requiredAPIs) {
            if (!code.includes(api)) {
                this.issues.push({
                    id: `ext-api-missing-${api}-${Date.now()}`,
                    type: 'preload',
                    severity: 'major',
                    description: `Extension API not exposed: ${api}`,
                    location: filePath,
                    suggestedFix: `Add ${api} to contextBridge.exposeInMainWorld`,
                    status: 'open',
                });
            }
        }
    }
    checkToolbarRendering(filePath, code) {
        // Check for toolbar icon rendering issues
        if (code.includes('extension') && code.includes('icon')) {
            if (!code.includes('onError') && !code.includes('onerror')) {
                this.issues.push({
                    id: `ext-icon-fallback-${Date.now()}`,
                    type: 'toolbar',
                    severity: 'major',
                    description: 'Extension icons missing error fallback',
                    location: filePath,
                    suggestedFix: 'Add onError handler with default icon fallback',
                    status: 'open',
                });
            }
        }
        // Check for click handler on toolbar icons
        if (code.includes('extension-toolbar') || code.includes('extensionToolbar')) {
            if (!code.includes('onClick') && !code.includes('click')) {
                this.issues.push({
                    id: `ext-toolbar-click-${Date.now()}`,
                    type: 'toolbar',
                    severity: 'critical',
                    description: 'Extension toolbar icons not clickable',
                    location: filePath,
                    suggestedFix: 'Add click handlers to open extension popups',
                    status: 'open',
                });
            }
        }
    }
    calculateScore() {
        const criticalIssues = this.issues.filter((i) => i.severity === 'critical').length;
        const majorIssues = this.issues.filter((i) => i.severity === 'major').length;
        const minorIssues = this.issues.filter((i) => i.severity === 'minor').length;
        this.score = Math.max(0, 100 - criticalIssues * 25 - majorIssues * 10 - minorIssues * 3);
    }
    generateSuggestions() {
        if (this.issues.some((i) => i.type === 'extension-loading')) {
            this.suggestions.push('Create an ExtensionManager class to centralize all extension operations');
        }
        if (this.issues.some((i) => i.type === 'toolbar')) {
            this.suggestions.push('Implement an ExtensionToolbar React component with proper state management');
        }
        this.suggestions.push('Add extension health monitoring to detect crashed extensions');
    }
    async generateFixes() {
        const fixes = new Map();
        return fixes;
    }
}
// ========================== INTEGRATION AGENT ==========================
class IntegrationAgent extends BrowserHubAgent {
    constructor() {
        super('integration-agent', 'SystemSynergy', [
            {
                name: 'api-connectivity',
                description: 'Check API connections to backend',
                priority: 'critical',
            },
            {
                name: 'event-flow',
                description: 'Verify event propagation between components',
                priority: 'high',
            },
            { name: 'state-sync', description: 'Check state synchronization', priority: 'high' },
            {
                name: 'cdp-integration',
                description: 'Verify Chrome DevTools Protocol setup',
                priority: 'medium',
            },
        ]);
    }
    async analyze(codebase) {
        this.iteration++;
        this.issues = [];
        this.suggestions = [];
        for (const [filePath, code] of codebase.entries()) {
            this.checkAPIIntegration(filePath, code);
            this.checkStateManagement(filePath, code);
            this.checkEventHandling(filePath, code);
            this.checkCDPSetup(filePath, code);
        }
        this.calculateScore();
        this.generateSuggestions();
        return this.getReport();
    }
    checkAPIIntegration(filePath, code) {
        // Check for proper API error handling
        if ((code.includes('fetch(') || code.includes('axios')) && !code.includes('catch')) {
            this.issues.push({
                id: `int-api-error-${Date.now()}`,
                type: 'api',
                severity: 'major',
                description: 'API calls missing error handling',
                location: filePath,
                suggestedFix: 'Add .catch() or try-catch for all API calls',
                status: 'open',
            });
        }
        // Check for hardcoded URLs
        if (code.includes('http://localhost') && !code.includes('process.env')) {
            this.issues.push({
                id: `int-hardcoded-url-${Date.now()}`,
                type: 'config',
                severity: 'minor',
                description: 'Hardcoded localhost URLs detected',
                location: filePath,
                suggestedFix: 'Use environment variables for API URLs',
                status: 'open',
            });
        }
    }
    checkStateManagement(filePath, code) {
        // Check for Redux store issues
        if (code.includes('useSelector') && !code.includes('shallowEqual')) {
            this.issues.push({
                id: `int-redux-rerender-${Date.now()}`,
                type: 'state',
                severity: 'minor',
                description: 'Redux selector may cause unnecessary re-renders',
                location: filePath,
                suggestedFix: 'Consider using shallowEqual or memoized selectors',
                status: 'open',
            });
        }
    }
    checkEventHandling(filePath, code) {
        // Check for proper IPC event cleanup
        if (code.includes('ipcRenderer.on') &&
            !code.includes('removeListener') &&
            !code.includes('removeAllListeners')) {
            this.issues.push({
                id: `int-ipc-leak-${Date.now()}`,
                type: 'memory',
                severity: 'major',
                description: 'IPC listeners not cleaned up (potential memory leak)',
                location: filePath,
                suggestedFix: 'Remove IPC listeners in useEffect cleanup or componentWillUnmount',
                status: 'open',
            });
        }
    }
    checkCDPSetup(filePath, code) {
        // Check CDP configuration
        if (code.includes('remote-debugging-port')) {
            if (!code.includes('remote-allow-origins')) {
                this.issues.push({
                    id: `int-cdp-origins-${Date.now()}`,
                    type: 'cdp',
                    severity: 'minor',
                    description: 'CDP missing remote-allow-origins flag',
                    location: filePath,
                    suggestedFix: "Add app.commandLine.appendSwitch('remote-allow-origins', '*')",
                    status: 'open',
                });
            }
        }
    }
    calculateScore() {
        const criticalIssues = this.issues.filter((i) => i.severity === 'critical').length;
        const majorIssues = this.issues.filter((i) => i.severity === 'major').length;
        const minorIssues = this.issues.filter((i) => i.severity === 'minor').length;
        this.score = Math.max(0, 100 - criticalIssues * 20 - majorIssues * 8 - minorIssues * 2);
    }
    generateSuggestions() {
        this.suggestions.push('Implement a unified event bus for component communication');
        this.suggestions.push('Create an API client wrapper with retry logic and error handling');
        this.suggestions.push('Add connection status monitoring for relay server');
    }
    async generateFixes() {
        const fixes = new Map();
        return fixes;
    }
}
// ========================== CODE QUALITY AGENT ==========================
class CodeQualityAgent extends BrowserHubAgent {
    constructor() {
        super('quality-agent', 'CodeCraftsman', [
            { name: 'architecture', description: 'Evaluate code architecture', priority: 'high' },
            { name: 'performance', description: 'Check performance patterns', priority: 'high' },
            { name: 'type-safety', description: 'Verify TypeScript usage', priority: 'medium' },
            { name: 'best-practices', description: 'Check coding best practices', priority: 'medium' },
        ]);
    }
    async analyze(codebase) {
        this.iteration++;
        this.issues = [];
        this.suggestions = [];
        for (const [filePath, code] of codebase.entries()) {
            this.checkTypeScript(filePath, code);
            this.checkPerformance(filePath, code);
            this.checkArchitecture(filePath, code);
            this.checkBestPractices(filePath, code);
        }
        this.calculateScore();
        this.generateSuggestions();
        return this.getReport();
    }
    checkTypeScript(filePath, code) {
        // Check for any types
        if (code.includes(': any') || code.includes('as any')) {
            const count = (code.match(/:\s*any|as\s+any/g) || []).length;
            this.issues.push({
                id: `qual-any-type-${Date.now()}`,
                type: 'type-safety',
                severity: count > 5 ? 'major' : 'minor',
                description: `Found ${count} uses of 'any' type`,
                location: filePath,
                suggestedFix: 'Replace any with proper types or unknown',
                status: 'open',
            });
        }
    }
    checkPerformance(filePath, code) {
        // Check for inline function definitions in JSX
        if (code.includes('onClick={() =>') || code.includes('onChange={() =>')) {
            this.issues.push({
                id: `qual-inline-handler-${Date.now()}`,
                type: 'performance',
                severity: 'minor',
                description: 'Inline arrow functions in JSX cause unnecessary re-renders',
                location: filePath,
                suggestedFix: 'Use useCallback for event handlers',
                status: 'open',
            });
        }
        // Check for expensive operations in render
        if (code.includes('.filter(') || code.includes('.map(')) {
            if (!code.includes('useMemo') && !code.includes('useCallback')) {
                this.issues.push({
                    id: `qual-memo-missing-${Date.now()}`,
                    type: 'performance',
                    severity: 'minor',
                    description: 'Array operations not memoized',
                    location: filePath,
                    suggestedFix: 'Consider useMemo for expensive computations',
                    status: 'open',
                });
            }
        }
    }
    checkArchitecture(filePath, code) {
        // Check file size
        const lineCount = code.split('\n').length;
        if (lineCount > 500) {
            this.issues.push({
                id: `qual-file-size-${Date.now()}`,
                type: 'architecture',
                severity: lineCount > 1000 ? 'major' : 'minor',
                description: `File has ${lineCount} lines - consider splitting`,
                location: filePath,
                suggestedFix: 'Break into smaller, focused modules',
                status: 'open',
            });
        }
    }
    checkBestPractices(filePath, code) {
        // Check for console.log in production code
        if (code.includes('console.log(') && !filePath.includes('test')) {
            this.issues.push({
                id: `qual-console-log-${Date.now()}`,
                type: 'best-practices',
                severity: 'minor',
                description: 'Console.log statements found',
                location: filePath,
                suggestedFix: 'Replace with proper logging service',
                status: 'open',
            });
        }
    }
    calculateScore() {
        const criticalIssues = this.issues.filter((i) => i.severity === 'critical').length;
        const majorIssues = this.issues.filter((i) => i.severity === 'major').length;
        const minorIssues = this.issues.filter((i) => i.severity === 'minor').length;
        this.score = Math.max(0, 100 - criticalIssues * 15 - majorIssues * 7 - minorIssues * 2);
    }
    generateSuggestions() {
        this.suggestions.push('Create interfaces/types file for shared type definitions');
        this.suggestions.push('Implement proper error boundaries for React components');
        this.suggestions.push('Add comprehensive unit tests for critical paths');
    }
    async generateFixes() {
        const fixes = new Map();
        return fixes;
    }
}
// ========================== SWARM ORCHESTRATOR ==========================
let BrowserHubSwarmService = BrowserHubSwarmService_1 = class BrowserHubSwarmService {
    constructor(drizzle, eventEmitter) {
        this.drizzle = drizzle;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(BrowserHubSwarmService_1.name);
        this.agents = [];
        this.currentIteration = 0;
        this.targetScore = 95; // World-class threshold
        this.maxIterations = 10;
        this.codebase = new Map();
        this.swarmStatus = {
            totalAgents: 0,
            activeAgents: 0,
            currentIteration: 0,
            overallScore: 0,
            reports: [],
            targetScore: 95,
            phaseName: 'Initialization',
        };
        // Initialize specialized agents
        this.agents = [
            new UIUXAgent(),
            new ExtensionAgent(),
            new IntegrationAgent(),
            new CodeQualityAgent(),
        ];
        this.swarmStatus.totalAgents = this.agents.length;
    }
    async onModuleInit() {
        this.logger.log('🚀 Browser Hub Improvement Swarm initializing...');
        this.logger.log(`   Target Score: ${this.targetScore}%`);
        this.logger.log(`   Max Iterations: ${this.maxIterations}`);
        this.logger.log(`   Agents: ${this.agents.map((a) => a.agentName).join(', ')}`);
        this.eventEmitter.emit('swarm.initialized', {
            agents: this.agents.length,
            targetScore: this.targetScore,
        });
    }
    /**
     * Load the Browser Hub codebase for analysis
     */
    async loadCodebase(basePath) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.html', '.css'];
        const loadDirectory = (dirPath) => {
            try {
                const entries = fs.readdirSync(dirPath, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dirPath, entry.name);
                    if (entry.isDirectory()) {
                        if (!entry.name.includes('node_modules') && !entry.name.includes('dist')) {
                            loadDirectory(fullPath);
                        }
                    }
                    else if (entry.isFile()) {
                        const ext = path.extname(entry.name);
                        if (extensions.includes(ext)) {
                            const content = fs.readFileSync(fullPath, 'utf-8');
                            const relativePath = fullPath.replace(basePath, '');
                            this.codebase.set(relativePath, content);
                        }
                    }
                }
            }
            catch (error) {
                this.logger.warn(`Could not load directory: ${dirPath}`);
            }
        };
        loadDirectory(basePath);
        this.logger.log(`Loaded ${this.codebase.size} files from codebase`);
    }
    /**
     * Run a single iteration of all agents
     */
    async runIteration() {
        this.currentIteration++;
        this.swarmStatus.currentIteration = this.currentIteration;
        this.swarmStatus.phaseName = `Iteration ${this.currentIteration}`;
        this.swarmStatus.reports = [];
        this.logger.log(`\n${'='.repeat(60)}`);
        this.logger.log(`ITERATION ${this.currentIteration}`);
        this.logger.log(`${'='.repeat(60)}\n`);
        // Run all agents in parallel
        const reportPromises = this.agents.map((agent) => agent.analyze(this.codebase));
        const reports = await Promise.all(reportPromises);
        this.swarmStatus.reports = reports;
        this.swarmStatus.activeAgents = this.agents.length;
        // Calculate overall score (weighted average)
        const weights = {
            UIUXGuardian: 1.2, // UI is critical for user experience
            ExtensionMaster: 1.5, // Extension handling is the main issue
            SystemSynergy: 1.0, // Integration is important
            CodeCraftsman: 0.8, // Code quality is foundational
        };
        let weightedSum = 0;
        let totalWeight = 0;
        for (const report of reports) {
            const weight = weights[report.agentName] || 1.0;
            weightedSum += report.score * weight;
            totalWeight += weight;
            this.logger.log(`📊 ${report.agentName}: ${report.score}% (${report.issues.length} issues)`);
            if (report.issues.length > 0) {
                for (const issue of report.issues.slice(0, 3)) {
                    const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'major' ? '🟠' : '🟡';
                    this.logger.log(`   ${icon} ${issue.description}`);
                }
                if (report.issues.length > 3) {
                    this.logger.log(`   ... and ${report.issues.length - 3} more`);
                }
            }
        }
        this.swarmStatus.overallScore = Math.round(weightedSum / totalWeight);
        this.logger.log(`\n📈 Overall Score: ${this.swarmStatus.overallScore}%`);
        this.logger.log(`🎯 Target Score: ${this.targetScore}%`);
        if (this.swarmStatus.overallScore >= this.targetScore) {
            this.logger.log(`\n🎉 TARGET ACHIEVED! Browser Hub is now world-class.`);
            this.swarmStatus.phaseName = 'Target Achieved';
        }
        else {
            this.logger.log(`\n📝 ${this.targetScore - this.swarmStatus.overallScore}% to go...`);
        }
        // Emit progress event
        this.eventEmitter.emit('swarm.iteration.complete', this.swarmStatus);
        return this.swarmStatus;
    }
    /**
     * Run iterations until target score is achieved or max iterations reached
     */
    async runUntilComplete() {
        this.logger.log('\n🚀 Starting Browser Hub Improvement Campaign...\n');
        while (this.currentIteration < this.maxIterations) {
            const status = await this.runIteration();
            if (status.overallScore >= this.targetScore) {
                this.logger.log('\n✅ Browser Hub has achieved world-class status!');
                break;
            }
            // Small delay between iterations
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (this.currentIteration >= this.maxIterations) {
            this.logger.log(`\n⚠️ Max iterations (${this.maxIterations}) reached.`);
            this.logger.log('Manual intervention may be needed for remaining issues.');
        }
        return this.swarmStatus;
    }
    /**
     * Get current swarm status
     */
    getStatus() {
        return this.swarmStatus;
    }
    /**
     * Get all issues from all agents
     */
    getAllIssues() {
        const allIssues = [];
        for (const report of this.swarmStatus.reports) {
            allIssues.push(...report.issues);
        }
        return allIssues.sort((a, b) => {
            const severityOrder = { critical: 0, major: 1, minor: 2 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
    }
    /**
     * Get all suggestions from all agents
     */
    getAllSuggestions() {
        const allSuggestions = [];
        for (const report of this.swarmStatus.reports) {
            allSuggestions.push(...report.suggestions);
        }
        return [...new Set(allSuggestions)]; // Remove duplicates
    }
    /**
     * Generate improvement plan
     */
    generateImprovementPlan() {
        const issues = this.getAllIssues();
        const suggestions = this.getAllSuggestions();
        return {
            timestamp: new Date().toISOString(),
            currentScore: this.swarmStatus.overallScore,
            targetScore: this.targetScore,
            iterations: this.currentIteration,
            criticalFixes: issues.filter((i) => i.severity === 'critical'),
            majorFixes: issues.filter((i) => i.severity === 'major'),
            minorFixes: issues.filter((i) => i.severity === 'minor'),
            architectureSuggestions: suggestions,
            prioritizedActionItems: [
                '1. Fix Extension Toolbar - Icons not displaying and click handlers missing',
                '2. Add error handling for extension loading',
                '3. Implement proper state management for extensions',
                '4. Apply TNF brand design system consistently',
                '5. Add accessibility attributes to all interactive elements',
                '6. Create reusable component library',
                '7. Add comprehensive error boundaries',
                '8. Implement connection status monitoring',
            ],
            estimatedEffort: this.estimateEffort(issues),
        };
    }
    estimateEffort(issues) {
        const critical = issues.filter((i) => i.severity === 'critical').length;
        const major = issues.filter((i) => i.severity === 'major').length;
        const minor = issues.filter((i) => i.severity === 'minor').length;
        const hours = critical * 4 + major * 2 + minor * 0.5;
        if (hours < 8)
            return '1 day';
        if (hours < 24)
            return '2-3 days';
        if (hours < 40)
            return '1 week';
        return '2+ weeks';
    }
};
exports.BrowserHubSwarmService = BrowserHubSwarmService;
exports.BrowserHubSwarmService = BrowserHubSwarmService = BrowserHubSwarmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService,
        event_emitter_1.EventEmitter2])
], BrowserHubSwarmService);
//# sourceMappingURL=browser-hub-swarm.service.js.map