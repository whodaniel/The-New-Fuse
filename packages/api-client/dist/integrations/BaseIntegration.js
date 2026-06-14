/**
 * Base integration class that implements common functionality
 */
export class BaseIntegration {
    constructor(id, name, type, config, description, capabilities) {
        this.isConnected = false;
        this.isEnabled = true;
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
export { IntegrationType } from "./types.js";
//# sourceMappingURL=BaseIntegration.js.map