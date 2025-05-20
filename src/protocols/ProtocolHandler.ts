import { PythonBridge } from '../utils/PythonBridge.js';
import { A2AMessage, MCPContext } from './types.js';

export class ProtocolHandler {
    private pythonBridge: PythonBridge;
    private mcpContext: MCPContext;

    constructor() {
        this.pythonBridge = new PythonBridge({
            pythonPath: './protocols/base_agent.py'
        });
        this.mcpContext = new MCPContext();
    }

    async initialize(): Promise<void> {
        await this.pythonBridge.initialize();
        await this.mcpContext.sync();
    }

    async sendMessage(target: string, payload: A2AMessage): Promise<void> {
        return await this.pythonBridge.invoke('communicate', {
            target,
            payload,
            context: this.mcpContext.current
        });
    }

    async updateContext(context: Partial<MCPContext>): Promise<void> {
        await this.mcpContext.update(context);
        await this.pythonBridge.invoke('sync_context', {
            context: this.mcpContext.current
        });
    }
}