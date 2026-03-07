import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StateManager {
  private readonly logger = new Logger(StateManager.name);
  constructor() {}
}
