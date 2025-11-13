import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { A2AService } from '../services/A2AService';
export declare class A2AGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly a2aService;
    server: Server;
    private logger;
    constructor(a2aService: A2AService);
    handleConnection(client: Socket): void;
    handleRegisterAgent(data: {
        agentId: string;
        capabilities: string[];
    }, client: Socket): Promise<{
        success: boolean;
        agentId: any;
    }>;
    catch(error: any): {
        success: boolean;
        error: string;
    };
}
//# sourceMappingURL=A2AGateway.d.ts.map