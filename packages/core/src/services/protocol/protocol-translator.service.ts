import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ProtocolTranslatorService {
  private readonly logger = new Logger(ProtocolTranslatorService.name);

  constructor() {}
}
