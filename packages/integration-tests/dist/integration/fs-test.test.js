"use strict";
/**
 * Simple filesystem test to verify fs operations work correctly
 * @jest-environment node
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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
describe('Filesystem Operations Test', () => {
    const testDir = path.join(__dirname, '../../test-fs-debug');
    const testFile = path.join(testDir, 'test.json');
    beforeAll(async () => {
        await fs.ensureDir(testDir);
    });
    afterAll(async () => {
        await fs.remove(testDir);
    });
    test('should write and read files correctly', async () => {
        const testData = { message: 'Hello World', timestamp: Date.now() };
        // Write file
        await fs.writeJson(testFile, testData, { spaces: 2 });
        // File written to: testFile
        // Test file existence check
        const exists = await fs.pathExists(testFile);
        // File exists (fs.pathExists): exists
        expect(exists).toBe(true);
        // Read file content
        const content = await fs.readFile(testFile, 'utf8');
        // File content type, length, and preview logged for debugging
        expect(content).toBeDefined();
        expect(typeof content).toBe('string');
        expect(content.length).toBeGreaterThan(0);
        // Parse and verify JSON
        const parsedData = JSON.parse(content);
        expect(parsedData.message).toBe('Hello World');
        expect(parsedData.timestamp).toBe(testData.timestamp);
    });
});
//# sourceMappingURL=fs-test.test.js.map