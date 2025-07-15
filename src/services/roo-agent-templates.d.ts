/**
 * Roo Agent Templates and Configurations
 *
 * This file contains all the pre-defined agent templates, API profiles,
 * MCP server configurations, and team setups for The New Fuse platform.
 */
import { AgentTemplate } from './RooAgentAutomationService';
/**
 * Comprehensive Agent Templates Library
 */
export declare const AGENT_TEMPLATES: Record<string, AgentTemplate>;
/**
 * API Configuration Profiles
 */
export declare const API_PROFILES: {
    'high-performance': {
        name: string;
        provider: string;
        model: string;
        temperature: number;
        maxTokens: number;
        topP: number;
    };
    'cost-effective': {
        name: string;
        provider: string;
        model: string;
        temperature: number;
        maxTokens: number;
        topP: number;
        rateLimitDelay: number;
    };
    creative: {
        name: string;
        provider: string;
        model: string;
        temperature: number;
        maxTokens: number;
        topP: number;
    };
    precise: {
        name: string;
        provider: string;
        model: string;
        temperature: number;
        maxTokens: number;
        topP: number;
    };
};
/**
 * MCP Server Configurations
 */
export declare const MCP_SERVERS: {
    context7: {
        name: string;
        command: string;
        args: string[];
        type: "stdio";
        description: string;
        enabled: boolean;
    };
    filesystem: {
        name: string;
        command: string;
        args: string[];
        type: "stdio";
        description: string;
        enabled: boolean;
    };
    git: {
        name: string;
        command: string;
        args: string[];
        type: "stdio";
        description: string;
        enabled: boolean;
    };
    docker: {
        name: string;
        command: string;
        args: any[];
        type: "stdio";
        description: string;
        enabled: boolean;
    };
    'tnf-workflow': {
        name: string;
        command: string;
        args: string[];
        type: "stdio";
        description: string;
        enabled: boolean;
    };
    'tnf-agent': {
        name: string;
        command: string;
        args: string[];
        type: "stdio";
        description: string;
        enabled: boolean;
    };
};
/**
 * Team Configurations
 */
export declare const TEAM_CONFIGURATIONS: {
    fullstack: {
        name: string;
        description: string;
        members: string[];
        sharedMCPServers: string[];
        communicationChannels: string[];
    };
    startup: {
        name: string;
        description: string;
        members: string[];
        sharedMCPServers: string[];
        communicationChannels: string[];
    };
    'tnf-platform': {
        name: string;
        description: string;
        members: string[];
        sharedMCPServers: string[];
        communicationChannels: string[];
    };
};
//# sourceMappingURL=roo-agent-templates.d.ts.map