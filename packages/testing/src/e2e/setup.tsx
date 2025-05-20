import { TestEnvironment, TestConfig } from '@the-new-fuse/testing';

export class E2ETestFramework {
  constructor(private config: TestConfig) {}

  async setupEnvironment(): Promise<void> {
    const agent = new TestEnvironment(this.config);
    await this.agentTestRunner.initialize();
    return agent.runBehaviorTests();
  }
}
