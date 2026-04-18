"use strict";
/**
 * WorkflowParser
 * Parses n8n workflow JSON files and extracts metadata
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowParser = void 0;
class WorkflowParser {
    /**
     * Parse a workflow JSON file
     */
    parseWorkflow(workflowJson, source, filePath) {
        try {
            if (!this.isValidWorkflow(workflowJson)) {
                console.error(`Invalid workflow format: ${filePath}`);
                return null;
            }
            const nodes = this.extractNodes(workflowJson);
            const triggers = this.extractTriggers(nodes);
            const metadata = this.extractMetadata(workflowJson, source, filePath);
            const analysis = this.analyzeWorkflow(nodes);
            const workflow = {
                id: this.generateWorkflowId(workflowJson, filePath),
                name: workflowJson.name || 'Unnamed Workflow',
                description: this.extractDescription(workflowJson),
                category: 'other', // Will be categorized later
                nodes,
                connections: workflowJson.connections || {},
                triggers,
                source,
                tags: this.extractTags(workflowJson),
                jsonDefinition: workflowJson,
                metadata: {
                    ...metadata,
                    complexity: analysis.complexity,
                    requiredCredentials: analysis.requiredCredentials,
                    useCases: this.extractUseCases(workflowJson, nodes),
                },
                settings: workflowJson.settings,
                staticData: workflowJson.staticData,
                active: workflowJson.active || false,
                createdAt: new Date(workflowJson.createdAt || Date.now()),
                updatedAt: new Date(workflowJson.updatedAt || Date.now()),
            };
            return workflow;
        }
        catch (error) {
            console.error(`Error parsing workflow ${filePath}:`, error);
            return null;
        }
    }
    /**
     * Validate workflow structure
     */
    isValidWorkflow(workflowJson) {
        return (workflowJson &&
            typeof workflowJson === 'object' &&
            (workflowJson.nodes || workflowJson.nodes === null) &&
            workflowJson.name);
    }
    /**
     * Extract nodes from workflow
     */
    extractNodes(workflowJson) {
        if (!workflowJson.nodes || !Array.isArray(workflowJson.nodes)) {
            return [];
        }
        return workflowJson.nodes.map((node) => ({
            id: node.id || node.name,
            name: node.name,
            type: node.type,
            typeVersion: node.typeVersion,
            position: node.position || [0, 0],
            parameters: node.parameters || {},
            credentials: node.credentials,
            webhookId: node.webhookId,
            disabled: node.disabled || false,
        }));
    }
    /**
     * Extract trigger nodes
     */
    extractTriggers(nodes) {
        const triggerTypes = [
            'n8n-nodes-base.trigger',
            'n8n-nodes-base.webhook',
            'n8n-nodes-base.cronTrigger',
            'n8n-nodes-base.manualTrigger',
            'n8n-nodes-base.start',
        ];
        return nodes
            .filter((node) => node.type.toLowerCase().includes('trigger') ||
            triggerTypes.includes(node.type) ||
            node.type.toLowerCase().includes('webhook') ||
            node.type === 'n8n-nodes-base.start')
            .map((node) => ({
            ...node,
            type: this.determineTriggerType(node),
            webhookUrl: node.parameters?.webhookUrl,
            scheduleExpression: node.parameters?.rule,
        }));
    }
    /**
     * Determine trigger type
     */
    determineTriggerType(node) {
        const type = node.type.toLowerCase();
        if (type.includes('webhook'))
            return 'webhook';
        if (type.includes('cron') || type.includes('schedule'))
            return 'schedule';
        if (type.includes('manual') || type === 'n8n-nodes-base.start')
            return 'manual';
        return 'trigger';
    }
    /**
     * Extract metadata
     */
    extractMetadata(workflowJson, source, filePath) {
        return {
            id: this.generateWorkflowId(workflowJson, filePath),
            name: workflowJson.name || 'Unnamed Workflow',
            description: this.extractDescription(workflowJson),
            tags: this.extractTags(workflowJson),
            category: 'other',
            author: workflowJson.meta?.author || workflowJson.author,
            createdAt: new Date(workflowJson.createdAt || Date.now()),
            updatedAt: new Date(workflowJson.updatedAt || Date.now()),
            source,
        };
    }
    /**
     * Generate unique workflow ID
     */
    generateWorkflowId(workflowJson, filePath) {
        if (workflowJson.id) {
            return `${workflowJson.id}`;
        }
        // Create ID from name and file path
        const name = workflowJson.name || 'workflow';
        const path = filePath || '';
        const hash = this.simpleHash(name + path);
        return `workflow-${hash}`;
    }
    /**
     * Simple hash function
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    /**
     * Extract description
     */
    extractDescription(workflowJson) {
        return (workflowJson.description ||
            workflowJson.meta?.description ||
            workflowJson.notes ||
            `N8N workflow: ${workflowJson.name}`);
    }
    /**
     * Extract tags
     */
    extractTags(workflowJson) {
        const tags = [];
        if (workflowJson.tags && Array.isArray(workflowJson.tags)) {
            tags.push(...workflowJson.tags.map((tag) => (typeof tag === 'string' ? tag : tag.name)));
        }
        if (workflowJson.meta?.tags) {
            tags.push(...workflowJson.meta.tags);
        }
        return [...new Set(tags.map((tag) => tag.toLowerCase().trim()))];
    }
    /**
     * Extract use cases from workflow
     */
    extractUseCases(workflowJson, nodes) {
        const useCases = [];
        // Extract from description
        const description = this.extractDescription(workflowJson).toLowerCase();
        // Common use case patterns
        const patterns = {
            'data sync': ['sync', 'synchronize', 'synchronization'],
            notification: ['notify', 'notification', 'alert', 'email'],
            automation: ['automate', 'automation', 'automatic'],
            integration: ['integrate', 'integration', 'connect'],
            webhook: ['webhook', 'api'],
            'scheduled task': ['schedule', 'cron', 'daily', 'weekly'],
            'data processing': ['process', 'transform', 'parse'],
        };
        for (const [useCase, keywords] of Object.entries(patterns)) {
            if (keywords.some((keyword) => description.includes(keyword))) {
                useCases.push(useCase);
            }
        }
        // Extract from node types
        const nodeTypes = nodes.map((n) => n.type.toLowerCase());
        if (nodeTypes.some((t) => t.includes('gmail') || t.includes('email'))) {
            useCases.push('email automation');
        }
        if (nodeTypes.some((t) => t.includes('slack') || t.includes('discord'))) {
            useCases.push('team communication');
        }
        if (nodeTypes.some((t) => t.includes('database') || t.includes('sql'))) {
            useCases.push('database operations');
        }
        return [...new Set(useCases)];
    }
    /**
     * Analyze workflow complexity and structure
     */
    analyzeWorkflow(nodes) {
        const nodeTypes = this.extractNodeTypes(nodes);
        const triggerTypes = nodes
            .filter((n) => n.type.toLowerCase().includes('trigger'))
            .map((n) => n.type);
        const requiredCredentials = this.extractRequiredCredentials(nodes);
        const apiServices = this.extractApiServices(nodes);
        const complexity = this.calculateComplexity(nodes);
        return {
            nodeCount: nodes.length,
            nodeTypes,
            triggerTypes,
            complexity,
            requiredCredentials,
            apiServices,
        };
    }
    /**
     * Extract node type information
     */
    extractNodeTypes(nodes) {
        const uniqueTypes = new Map();
        nodes.forEach((node) => {
            if (!uniqueTypes.has(node.type)) {
                uniqueTypes.set(node.type, {
                    type: node.type,
                    displayName: this.getDisplayName(node.type),
                    description: '',
                    category: this.getCategoryFromNodeType(node.type),
                    credentials: node.credentials ? Object.keys(node.credentials) : undefined,
                });
            }
        });
        return Array.from(uniqueTypes.values());
    }
    /**
     * Get display name from node type
     */
    getDisplayName(nodeType) {
        const parts = nodeType.split('.');
        const name = parts[parts.length - 1];
        return name
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .replace(/^\w/, (c) => c.toUpperCase());
    }
    /**
     * Get category from node type
     */
    getCategoryFromNodeType(nodeType) {
        const type = nodeType.toLowerCase();
        if (type.includes('trigger') || type.includes('webhook'))
            return 'triggers';
        if (type.includes('database') || type.includes('sql'))
            return 'database';
        if (type.includes('http') || type.includes('api'))
            return 'api';
        if (type.includes('file'))
            return 'files';
        if (type.includes('email') || type.includes('gmail'))
            return 'email';
        if (type.includes('slack') || type.includes('discord'))
            return 'communication';
        return 'utility';
    }
    /**
     * Extract required credentials
     */
    extractRequiredCredentials(nodes) {
        const credentials = new Set();
        nodes.forEach((node) => {
            if (node.credentials) {
                Object.keys(node.credentials).forEach((cred) => credentials.add(cred));
            }
        });
        return Array.from(credentials);
    }
    /**
     * Extract API services used
     */
    extractApiServices(nodes) {
        const services = new Set();
        nodes.forEach((node) => {
            const type = node.type.toLowerCase();
            // Extract service names from node types
            const knownServices = [
                'gmail',
                'slack',
                'discord',
                'github',
                'gitlab',
                'jira',
                'trello',
                'notion',
                'airtable',
                'google',
                'drive',
                'sheets',
                'calendar',
                'stripe',
                'paypal',
                'shopify',
                'mailchimp',
                'sendgrid',
                'twitter',
                'linkedin',
                'facebook',
                'instagram',
                'aws',
                'azure',
                'gcp',
                'mongodb',
                'postgres',
                'mysql',
            ];
            knownServices.forEach((service) => {
                if (type.includes(service)) {
                    services.add(service);
                }
            });
        });
        return Array.from(services);
    }
    /**
     * Calculate workflow complexity
     */
    calculateComplexity(nodes) {
        const nodeCount = nodes.length;
        if (nodeCount <= 3)
            return 'simple';
        if (nodeCount <= 10)
            return 'medium';
        return 'complex';
    }
    /**
     * Batch parse workflows
     */
    parseWorkflows(workflows, source) {
        return workflows
            .map((workflow, index) => this.parseWorkflow(workflow, source, `workflow-${index}`))
            .filter((workflow) => workflow !== null);
    }
}
exports.WorkflowParser = WorkflowParser;
//# sourceMappingURL=WorkflowParser.js.map