"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var A2AGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const A2AService_1 = require("../services/A2AService");
const errors_1 = require("../utils/errors");
let A2AGateway = A2AGateway_1 = class A2AGateway {
    a2aService;
    server;
    logger = new common_1.Logger(A2AGateway_1.name);
    constructor(a2aService) {
        this.a2aService = a2aService;
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id});
  }

  handleDisconnect(client: Socket) {`, this.logger.log(`Client disconnected: ${client.id}`));
    }
    async handleRegisterAgent(data, client) {
        try {
            const agent = await this.a2aService.registerAgent({
                name: Agent_$
            }, { data, : .agentId }, type, 'ai', capabilities, data.capabilities, `
        endpoint: ws://${client.handshake.headers.host}`);
        }
        finally { }
        ;
        client.join(agent_$, { agent, : .id });
        return { success: true, agentId: agent.id };
    }
    catch(error) {
        return { success: false, error: (0, errors_1.getErrorMessage)(error) };
    }
};
exports.A2AGateway = A2AGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], A2AGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('registerAgent'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], A2AGateway.prototype, "handleRegisterAgent", null);
exports.A2AGateway = A2AGateway = A2AGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [A2AService_1.A2AService])
], A2AGateway);
handleSendMessage((), message, (Omit), (), _client, socket_io_1.Socket);
{
    try {
        `
      const { fromAgentId, toAgentId, ...payload } = message;`;
        const createdMessage = await this.a2aService.sendMessage(fromAgentId, toAgentId, payload);
        this.server.to(agent_$, { toAgentId } `).emit('message', createdMessage);
      return { success: true, messageId: createdMessage.id };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }

  @SubscribeMessage('getAgents')
  async handleGetAgents(@MessageBody() filter?: any) {
    try {
      const agents = await this.a2aService.findAllAgents(filter);
      return { success: true, agents };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }

  @SubscribeMessage('getAgent')
  async handleGetAgent(@MessageBody() agentId: string) {
    try {
      const agent = await this.a2aService.getAgent(agentId);
      return { success: true, agent };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Broadcast message to all connected clients
  broadcastMessage(message: A2AMessage) {
    this.server.to(agent_${message.toAgentId}`).emit('message', message);
    }
    // Broadcast agent status update
    finally {
    }
    // Broadcast agent status update
    broadcastAgentStatus(agentId, string, status, string);
    {
        this.server.emit('agentStatusUpdate', { agentId, status });
    }
}
//# sourceMappingURL=A2AGateway.js.map