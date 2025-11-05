export * from './TheNewFuseMCPServer';
export { TheNewFuseMCPServer as MCPServer } from './TheNewFuseMCPServer';
import { TheNewFuseMCPServer } from './TheNewFuseMCPServer';
export default TheNewFuseMCPServer;
export interface MCPServerConfig {
    name?: string;
    version?: string;
    isRemote?: boolean;
    capabilities?: {
        tools?: any;
        resources?: any;
        prompts?: any;
    };
}
//# sourceMappingURL=MCPServer.d.ts.map