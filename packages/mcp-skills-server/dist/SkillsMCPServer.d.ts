/**
 * Skills MCP Server
 * Exposes The New Fuse skills library via Model Context Protocol
 * Enables agents to discover and load skills dynamically
 */
/**
 * Skills MCP Server
 * Provides MCP interface to The New Fuse skills ecosystem
 */
export declare class SkillsMCPServer {
    private server;
    private skillsBasePath;
    private skillsCache;
    constructor(skillsBasePath?: string);
    /**
     * Initialize server and scan skills
     */
    initialize(): Promise<void>;
    /**
     * Scan .agent directory for skills
     */
    private scanSkills;
    /**
     * Parse a skill file to extract metadata
     */
    private parseSkillFile;
    /**
     * Setup MCP request handlers
     */
    private setupHandlers;
    /**
     * Start the server
     */
    start(): Promise<void>;
}
//# sourceMappingURL=SkillsMCPServer.d.ts.map