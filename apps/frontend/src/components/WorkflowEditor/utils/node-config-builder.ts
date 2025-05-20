export class NodeConfigBuilder {
    static createConfig(nodeTypeData) {
        const { properties, displayName } = nodeTypeData;
        return {
            type: nodeTypeData.name,
            name: displayName,
            inputs: properties.inputs || [],
            outputs: properties.outputs || [],
            parameters: this.mapParameters(properties.properties),
            credentials: properties.credentials || [],
        };
    }
    static mapParameters(properties) {
        return properties.reduce((acc, prop) => {
            acc[prop.name] = {
                type: prop.type,
                required: prop.required || false,
                displayOptions: prop.displayOptions || {},
                options: prop.options || [],
                default: prop.default,
                description: prop.description || '',
                placeholder: prop.placeholder || '',
                typeOptions: prop.typeOptions || {},
            };
            return acc;
        }, {});
    }
    static getDefaultParameters(config) {
        return Object.entries(config.parameters).reduce((acc, [key, value]) => {
            acc[key] = value.default;
            return acc;
        }, {});
    }
    static validateParameters(config, parameters) {
        const errors = [];
        Object.entries(config.parameters).forEach(([key, value]) => {
            if (value.required && !parameters[key]) {
                errors.push(`Parameter '${key}' is required`);
                return;
            }
            if (parameters[key] && value.type === 'number') {
                const num = Number(parameters[key]);
                if (isNaN(num)) {
                    errors.push(`Parameter '${key}' must be a number`);
                }
            }
            if (parameters[key] && value.type === 'options' && value.options.length > 0) {
                const validOptions = value.options.map((opt) => opt.value);
                if (!validOptions.includes(parameters[key])) {
                    errors.push(`Invalid option for parameter '${key}'`);
                }
            }
        });
        return errors;
    }
    static processSpecialNodeTypes(nodeType, parameters) {
        switch (nodeType) {
            case 'n8n-nodes-base.httpRequest':
                return this.processHttpRequestNode(parameters);
            case 'n8n-nodes-base.if':
                return this.processIfNode(parameters);
            case 'n8n-nodes-base.switch':
                return this.processSwitchNode(parameters);
            default:
                return parameters;
        }
    }
    static processHttpRequestNode(parameters) {
        if (parameters.headers && typeof parameters.headers === 'string') {
            try {
                parameters.headers = JSON.parse(parameters.headers);
            }
            catch (e) {
                parameters.headers = {};
            }
        }
        if (parameters.body && typeof parameters.body === 'string') {
            try {
                parameters.body = JSON.parse(parameters.body);
            }
            catch (e) {
            }
        }
        return parameters;
    }
    static processIfNode(parameters) {
        if (parameters.conditions) {
            parameters.conditions = parameters.conditions.map((condition) => (Object.assign(Object.assign({}, condition), { value1: condition.value1 || '', value2: condition.value2 || '', operation: condition.operation || 'equal' })));
        }
        return parameters;
    }
    static processSwitchNode(parameters) {
        if (parameters.rules) {
            parameters.rules = parameters.rules.map((rule) => (Object.assign(Object.assign({}, rule), { value: rule.value || '', operation: rule.operation || 'equal', output: rule.output || 0 })));
        }
        return parameters;
    }
}
//# sourceMappingURL=node-config-builder.js.map