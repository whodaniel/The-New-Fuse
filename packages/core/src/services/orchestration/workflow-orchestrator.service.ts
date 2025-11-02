import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WorkflowOrchestratorService {
  private readonly logger = new Logger(WorkflowOrchestratorService.name);

  constructor() {}
}
