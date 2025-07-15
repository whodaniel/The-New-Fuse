export class MCPFuseServer {
    agentServer;
    chatServer;
    workflowServer;
    fileCoordinationServer;
    options;
    logger = new Logger(MCPFuseServer.name);
    constructor(agentServer, chatServer, workflowServer, fileCoordinationServer, options = {}) {
        this.agentServer = agentServer;
        this.chatServer = chatServer;
        this.workflowServer = workflowServer;
        this.fileCoordinationServer = fileCoordinationServer;
        this.options = options;
    }
    getTools() {
        return {
            ...this.wrapServerTools(this.agentServer, "agentServer"),
            ...this.wrapServerTools(this.chatServer, "chatServer"),
            ...this.wrapServerTools(this.workflowServer, "workflowServer"),
            ...this.wrapServerTools(this.fileCoordinationServer, "fileCoordination"),
        };
    }
    wrapServerTools(server, prefix) {
        return Object.entries(server.getTools()).reduce((tools, [name, tool]) => ({
            ...tools,
            [`${prefix}.${name}`]: {
                ...tool,
                execute: async (...args) => {
                    try {
                        return await this[prefix][name](...args);
                    }
                    catch (error) {
                        this.logger.error(`Error executing ${prefix}.${name}:`, error);
                        throw error;
                    }
                },
            },
        }), {});
    }
}
