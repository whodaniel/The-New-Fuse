import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OnboardingConfigService {
  private readonly logger = new Logger(OnboardingConfigService.name);

  constructor() {}
}
