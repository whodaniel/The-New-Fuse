import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BridgeService {
  private readonly logger = new Logger(BridgeService.name);

  constructor() {}
}
