"use strict";
/**
 * Skill Parser
 *
 * Parses SKILL.md files with YAML frontmatter and markdown content
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillParser = void 0;
const fs = __importStar(require("fs/promises"));
const gray_matter_1 = __importDefault(require("gray-matter"));
const path = __importStar(require("path"));
const zod_1 = require("zod");
const index_js_1 = require("../types/index.js");
/**
 * Zod schema for skill frontmatter validation
 */
const SkillFrontmatterSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .regex(/^[a-z0-9-]+$/, 'Name must be in hyphen-case with lowercase alphanumeric characters'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    license: zod_1.z.string().optional(),
    'allowed-tools': zod_1.z.array(zod_1.z.string()).optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
});
/**
 * Skill parser class
 */
class SkillParser {
    /**
     * Parse a SKILL.md file and return a ClaudeSkill object
     */
    async parseSkillFile(filePath) {
        try {
            // Read the file
            const content = await fs.readFile(filePath, 'utf-8');
            // Parse frontmatter and content
            const { data, content: markdownContent } = (0, gray_matter_1.default)(content);
            // Validate frontmatter
            const validationResult = SkillFrontmatterSchema.safeParse(data);
            if (!validationResult.success) {
                throw new Error(`Invalid skill frontmatter in ${filePath}: ${validationResult.error.message}`);
            }
            const frontmatter = validationResult.data;
            // Extract metadata
            const metadata = {
                name: frontmatter.name,
                description: frontmatter.description,
                license: frontmatter.license,
                allowedTools: frontmatter['allowed-tools'],
                metadata: frontmatter.metadata,
            };
            // Determine category and tags from file path and content
            const category = this.inferCategory(filePath, markdownContent);
            const tags = this.extractTags(filePath, markdownContent, frontmatter.name);
            // Create skill object
            const skill = {
                id: this.generateSkillId(frontmatter.name),
                name: frontmatter.name,
                description: frontmatter.description,
                category,
                tags,
                metadata,
                content: markdownContent,
                instructions: this.extractInstructions(markdownContent),
                parameters: this.extractParameters(markdownContent),
                localPath: filePath,
            };
            return skill;
        }
        catch (error) {
            throw new Error(`Failed to parse skill file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Parse multiple SKILL.md files from a directory
     */
    async parseSkillDirectory(directoryPath) {
        const skills = [];
        const entries = await fs.readdir(directoryPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const skillFilePath = path.join(directoryPath, entry.name, 'SKILL.md');
                try {
                    const stat = await fs.stat(skillFilePath);
                    if (stat.isFile()) {
                        const skill = await this.parseSkillFile(skillFilePath);
                        skills.push(skill);
                    }
                }
                catch (error) {
                    // Skip if SKILL.md doesn't exist in this directory
                    if (error.code !== 'ENOENT') {
                        console.warn(`Warning: Could not parse skill in ${entry.name}:`, error);
                    }
                }
            }
        }
        return skills;
    }
    /**
     * Generate a unique skill ID from the skill name
     */
    generateSkillId(name) {
        return `anthropic.skill.${name}`;
    }
    /**
     * Infer skill category from file path and content
     */
    inferCategory(filePath, content) {
        const pathLower = filePath.toLowerCase();
        const contentLower = content.toLowerCase();
        // Check document-skills subdirectory
        if (pathLower.includes('document-skills')) {
            return index_js_1.SkillCategory.DOCUMENT_PROCESSING;
        }
        // Check for specific skill names and patterns
        if (pathLower.includes('algorithmic-art') ||
            pathLower.includes('canvas-design') ||
            pathLower.includes('theme-factory') ||
            pathLower.includes('brand-guidelines')) {
            return index_js_1.SkillCategory.CREATIVE_DESIGN;
        }
        if (pathLower.includes('mcp-builder') ||
            pathLower.includes('webapp-testing') ||
            pathLower.includes('artifacts-builder')) {
            return index_js_1.SkillCategory.DEVELOPMENT_TECHNICAL;
        }
        if (pathLower.includes('internal-comms')) {
            return index_js_1.SkillCategory.ENTERPRISE_COMMUNICATION;
        }
        if (pathLower.includes('skill-creator') || pathLower.includes('template-skill')) {
            return index_js_1.SkillCategory.META_SKILLS;
        }
        // Check content for keywords
        if (contentLower.includes('test') || contentLower.includes('testing')) {
            return index_js_1.SkillCategory.TESTING;
        }
        if (contentLower.includes('refactor') || contentLower.includes('refactoring')) {
            return index_js_1.SkillCategory.REFACTORING;
        }
        if (contentLower.includes('documentation') || contentLower.includes('docs')) {
            return index_js_1.SkillCategory.DOCUMENTATION;
        }
        return index_js_1.SkillCategory.OTHER;
    }
    /**
     * Extract tags from file path and content
     */
    extractTags(filePath, content, skillName) {
        const tags = new Set();
        // Add skill name as a tag
        tags.add(skillName);
        // Extract from path
        const pathParts = filePath.split(path.sep);
        if (pathParts.includes('document-skills')) {
            tags.add('document');
            tags.add('file-processing');
        }
        // Common technology keywords
        const techKeywords = [
            'pdf',
            'xlsx',
            'docx',
            'pptx',
            'python',
            'typescript',
            'javascript',
            'react',
            'playwright',
            'mcp',
            'api',
            'testing',
            'design',
            'art',
            'creative',
            'communication',
            'enterprise',
        ];
        const contentLower = content.toLowerCase();
        for (const keyword of techKeywords) {
            if (contentLower.includes(keyword)) {
                tags.add(keyword);
            }
        }
        return Array.from(tags);
    }
    /**
     * Extract instructions from markdown content
     * Returns the main instructional content, excluding frontmatter
     */
    extractInstructions(content) {
        // Remove any remaining frontmatter markers
        const instructions = content.replace(/^---[\s\S]*?---/, '').trim();
        // Extract main content before examples/references sections if they exist
        const sections = instructions.split(/^#+\s+(Examples?|References?|Guidelines?)/im);
        if (sections.length > 1) {
            // Return everything before the first major section
            return sections[0].trim();
        }
        return instructions;
    }
    /**
     * Extract parameters from skill content
     * This is a basic implementation - can be enhanced based on skill conventions
     */
    extractParameters(_content) {
        // For now, we return empty array
        // In a real implementation, we might parse parameter definitions from the markdown
        // or from specific sections in the skill documentation
        return [];
    }
    /**
     * Validate a skill object
     */
    validateSkill(skill) {
        const errors = [];
        if (!skill.id) {
            errors.push('Skill ID is required');
        }
        if (!skill.name || !/^[a-z0-9-]+$/.test(skill.name)) {
            errors.push('Skill name must be in hyphen-case with lowercase alphanumeric characters');
        }
        if (!skill.description || skill.description.length < 10) {
            errors.push('Skill description must be at least 10 characters');
        }
        if (!skill.content || skill.content.trim().length === 0) {
            errors.push('Skill content cannot be empty');
        }
        if (!skill.category) {
            errors.push('Skill category is required');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
exports.SkillParser = SkillParser;
//# sourceMappingURL=SkillParser.js.map