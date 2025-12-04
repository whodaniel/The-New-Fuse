var NodeConfigBuilder = /** @class */ (function () {
    function NodeConfigBuilder() {
    }
    NodeConfigBuilder.createConfig = function (nodeTypeData) {
        var properties = nodeTypeData.properties, displayName = nodeTypeData.displayName;
        return {
            type: nodeTypeData.name,
            name: displayName,
            inputs: properties.inputs || [],
            outputs: properties.outputs || [],
            parameters: this.mapParameters(properties.properties),
            credentials: properties.credentials || [],
        };
    };
    NodeConfigBuilder.mapParameters = function (properties) {
        return properties.reduce(function (acc, prop) {
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
    };
    NodeConfigBuilder.getDefaultParameters = function (config) {
        return Object.entries(config.parameters).reduce(function (acc, _a) {
            var key = _a[0], value = _a[1];
            acc[key] = value.default;
            return acc;
        }, {});
    };
    NodeConfigBuilder.validateParameters = function (config, parameters) {
        var errors = [];
        Object.entries(config.parameters).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            if (value.required && !parameters[key]) {
                errors.push("Parameter '".concat(key, "' is required"));
                return;
            }
            if (parameters[key] && value.type === 'number') {
                var num = Number(parameters[key]);
                if (isNaN(num)) {
                    errors.push("Parameter '".concat(key, "' must be a number"));
                }
            }
            if (parameters[key] && value.type === 'options' && value.options.length > 0) {
                var validOptions = value.options.map(function (opt) { return opt.value; });
                if (!validOptions.includes(parameters[key])) {
                    errors.push("Invalid option for parameter '".concat(key, "'"));
                }
            }
        });
        return errors;
    };
    NodeConfigBuilder.processSpecialNodeTypes = function (nodeType, parameters) {
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
    };
    NodeConfigBuilder.processHttpRequestNode = function (parameters) {
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
    };
    NodeConfigBuilder.processIfNode = function (parameters) {
        if (parameters.conditions) {
            parameters.conditions = parameters.conditions.map(function (condition) { return (Object.assign(Object.assign({}, condition), { value1: condition.value1 || '', value2: condition.value2 || '', operation: condition.operation || 'equal' })); });
        }
        return parameters;
    };
    NodeConfigBuilder.processSwitchNode = function (parameters) {
        if (parameters.rules) {
            parameters.rules = parameters.rules.map(function (rule) { return (Object.assign(Object.assign({}, rule), { value: rule.value || '', operation: rule.operation || 'equal', output: rule.output || 0 })); });
        }
        return parameters;
    };
    return NodeConfigBuilder;
}());
export { NodeConfigBuilder };
