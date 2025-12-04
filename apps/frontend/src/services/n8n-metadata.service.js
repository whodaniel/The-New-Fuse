// N8n Metadata Service
// Provides node metadata and validation for workflow builder
var N8nMetadataService = /** @class */ (function () {
    function N8nMetadataService() {
        this.nodeMetadata = new Map();
        this.initializeBuiltInNodes();
    }
    N8nMetadataService.prototype.initializeBuiltInNodes = function () {
        // HTTP Request Node
        this.nodeMetadata.set('httpRequest', {
            id: 'httpRequest',
            name: 'HTTP Request',
            displayName: 'HTTP Request',
            type: 'n8n-nodes-base.httpRequest',
            category: 'HTTP',
            description: 'Make HTTP requests to any URL',
            parameters: [
                {
                    name: 'url',
                    displayName: 'URL',
                    type: 'string',
                    required: true,
                    description: 'The URL to make the request to'
                },
                {
                    name: 'method',
                    displayName: 'Method',
                    type: 'options',
                    required: true,
                    default: 'GET',
                    options: [
                        { name: 'GET', value: 'GET' },
                        { name: 'POST', value: 'POST' },
                        { name: 'PUT', value: 'PUT' },
                        { name: 'DELETE', value: 'DELETE' },
                        { name: 'PATCH', value: 'PATCH' }
                    ]
                },
                {
                    name: 'headers',
                    displayName: 'Headers',
                    type: 'collection',
                    description: 'Headers to send with the request'
                }
            ],
            inputs: [1],
            outputs: [1],
            icon: 'fa:globe'
        });
        // Slack Node
        this.nodeMetadata.set('slack', {
            id: 'slack',
            name: 'Slack',
            displayName: 'Slack',
            type: 'n8n-nodes-base.slack',
            category: 'Communication',
            description: 'Send messages to Slack channels',
            parameters: [
                {
                    name: 'channel',
                    displayName: 'Channel',
                    type: 'string',
                    required: true,
                    description: 'The channel to send the message to'
                },
                {
                    name: 'text',
                    displayName: 'Text',
                    type: 'string',
                    description: 'The message text to send'
                }
            ],
            credentials: ['slackApi'],
            inputs: [1],
            outputs: [1],
            icon: 'fab:slack'
        });
        // Start Node
        this.nodeMetadata.set('start', {
            id: 'start',
            name: 'Start',
            displayName: 'Start',
            type: 'n8n-nodes-base.start',
            category: 'Core',
            description: 'Starting point for workflow execution',
            parameters: [],
            inputs: [],
            outputs: [1],
            icon: 'fa:play'
        });
        // End Node
        this.nodeMetadata.set('end', {
            id: 'end',
            name: 'End',
            displayName: 'End',
            type: 'n8n-nodes-base.end',
            category: 'Core',
            description: 'End point for workflow execution',
            parameters: [],
            inputs: [1],
            outputs: [],
            icon: 'fa:stop'
        });
        // Code Node
        this.nodeMetadata.set('code', {
            id: 'code',
            name: 'Code',
            displayName: 'Code',
            type: 'n8n-nodes-base.code',
            category: 'Development',
            description: 'Execute custom JavaScript code',
            parameters: [
                {
                    name: 'code',
                    displayName: 'JavaScript Code',
                    type: 'string',
                    required: true,
                    description: 'The JavaScript code to execute'
                }
            ],
            inputs: [1],
            outputs: [1],
            icon: 'fa:code'
        });
    };
    N8nMetadataService.prototype.getNodeMetadata = function (nodeType) {
        return this.nodeMetadata.get(nodeType);
    };
    N8nMetadataService.prototype.getAllNodeMetadata = function () {
        return Array.from(this.nodeMetadata.values());
    };
    N8nMetadataService.prototype.getNodesByCategory = function (category) {
        return Array.from(this.nodeMetadata.values()).filter(function (node) { return node.category === category; });
    };
    N8nMetadataService.prototype.getCategories = function () {
        var categories = new Set();
        this.nodeMetadata.forEach(function (node) { return categories.add(node.category); });
        return Array.from(categories);
    };
    N8nMetadataService.prototype.validateNodeConfiguration = function (nodeType, parameters) {
        var metadata = this.getNodeMetadata(nodeType);
        if (!metadata) {
            return { isValid: false, errors: ["Unknown node type: ".concat(nodeType)] };
        }
        var errors = [];
        // Check required parameters
        metadata.parameters.forEach(function (param) {
            if (param.required && (!parameters[param.name] || parameters[param.name] === '')) {
                errors.push("Required parameter '".concat(param.displayName, "' is missing"));
            }
        });
        return { isValid: errors.length === 0, errors: errors };
    };
    N8nMetadataService.prototype.getDefaultParameterValues = function (nodeType) {
        var metadata = this.getNodeMetadata(nodeType);
        if (!metadata)
            return {};
        var defaults = {};
        metadata.parameters.forEach(function (param) {
            if (param.default !== undefined) {
                defaults[param.name] = param.default;
            }
        });
        return defaults;
    };
    N8nMetadataService.prototype.addCustomNode = function (metadata) {
        this.nodeMetadata.set(metadata.id, metadata);
    };
    N8nMetadataService.prototype.removeNode = function (nodeType) {
        return this.nodeMetadata.delete(nodeType);
    };
    return N8nMetadataService;
}());
var n8nMetadataService = new N8nMetadataService();
export default n8nMetadataService;
