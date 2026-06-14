/**
 * Defines the core interfaces for the Skill taxonomy, including Skills, Tools, and Resource Requirements.
 * This taxonomy is crucial for enabling advanced service discovery, agent capability matching,
 * and intelligent task delegation within The New Fuse ecosystem.
 */
/**
 * Represents a quantifiable or categorical requirement for a task or skill.
 *
 * @example
 * // A requirement for a specific GPU model
 * { type: 'HARDWARE', subtype: 'GPU', name: 'NVIDIA_RTX_4090', count: 1 }
 *
 * @example
 * // A requirement for a network port
 * { type: 'NETWORK', subtype: 'PORT', count: 2 }
 *
 * @example
 * // A requirement for a software dependency
 * { type: 'SOFTWARE', subtype: 'LIBRARY', name: 'tensorflow', version: '>=2.8' }
 */
export interface ResourceRequirement {
    type: 'HARDWARE' | 'SOFTWARE' | 'NETWORK' | 'DATA' | 'CREDENTIAL';
    subtype?: string;
    name?: string;
    version?: string;
    count: number;
    optional?: boolean;
}
/**
 * Represents a tool that an agent can use to perform a task.
 * Tools are concrete implementations or clients that interact with external systems.
 *
 * @example
 * { id: 'TOOL-BROWSER-CHROME', name: 'Chrome Web Browser' }
 *
 * @example
 * { id: 'TOOL-CODE-INTERPRETER', name: 'Python Code Interpreter' }
 */
export interface Tool {
    id: string;
    name: string;
    description?: string;
    version?: string;
}
/**
 * Represents a high-level skill or capability of an agent.
 * A skill is an aggregation of the tools and resources required to perform a certain class of tasks.
 * It provides a semantic layer for matching agents to tasks they are qualified to execute.
 *
 * @example
 * // A skill for scraping websites
 * const WebScrapingSkill: Skill = {
 *   id: 'SKILL-WEB-SCRAPING',
 *   name: 'Web Scraping',
 *   description: 'Ability to extract information from websites.',
 *   requiredTools: ['TOOL-BROWSER-CHROME'],
 *   requiredResources: [
 *     { type: 'NETWORK', subtype: 'PORT', count: 1 },
 *     { type: 'SOFTWARE', subtype: 'LIBRARY', name: 'beautifulsoup4', count: 1 }
 *   ]
 * };
 */
export interface Skill {
    id: string;
    name: string;
    description?: string;
    requiredTools: string[];
    requiredResources: ResourceRequirement[];
}
//# sourceMappingURL=skill.d.ts.map