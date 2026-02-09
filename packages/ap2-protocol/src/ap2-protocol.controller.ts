import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { Ap2ProtocolService } from './ap2-protocol.service';

@Controller('ap2')
export class Ap2ProtocolController {
  private readonly logger = new Logger(Ap2ProtocolController.name);

  constructor(private readonly ap2ProtocolService: Ap2ProtocolService) {}

  @Get('health')
  getHealth(): string {
    this.logger.log('AP2 Health Check');
    return 'AP2 Protocol Service is running';
  }

  @Post('payment')
  async createPayment(@Body() paymentDetails: { value: number; currency: string }) {
    this.logger.log('Creating payment via AP2');
    return this.ap2ProtocolService.createPayment(paymentDetails);
  }
}
