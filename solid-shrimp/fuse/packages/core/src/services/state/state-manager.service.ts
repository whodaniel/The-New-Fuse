import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StateManagerService {
  private readonly logger = new Logger(StateManagerService.name);

  constructor() {}
}
