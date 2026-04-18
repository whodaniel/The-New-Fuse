import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module.js';
import { WorkspaceGatewayController } from './workspace-gateway.controller.js';

@Module({
  imports: [ProxyModule],
  controllers: [WorkspaceGatewayController],
})
export class WorkspaceGatewayModule {}
