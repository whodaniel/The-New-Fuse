import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module';
import { WorkspaceGatewayController } from './workspace-gateway.controller';

@Module({
  imports: [ProxyModule],
  controllers: [WorkspaceGatewayController],
})
export class WorkspaceGatewayModule {}
