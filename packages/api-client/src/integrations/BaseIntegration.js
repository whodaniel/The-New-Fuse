/**
 * Base integration class that implements common functionality
 */
export class BaseIntegration {
    id;
    name;
    type;
    description;
    config;
    capabilities;
    isConnected = false;
    isEnabled = true;
    createdAt;
    updatedAt;
    constructor(id, name, type, config, description, capabilities) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.description = description;
        this.config = config;
        this.capabilities = {
            actions: [],
            triggers: [],
            ...capabilities,
        };
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
    /**
     * Update the last modified timestamp
     */
    updateTimestamp() {
        this.updatedAt = new Date();
    }
}
export { IntegrationType } from "./types";
//# sourceMappingURL=BaseIntegration.js.map