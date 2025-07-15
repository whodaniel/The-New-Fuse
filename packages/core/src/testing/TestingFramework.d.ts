export declare class TestingFramework {
  constructor();
  runSuite(suite: any, config?: any): Promise<Map<string, any>>;
  runSuites(suites: any[], config?: any): Promise<Map<string, any>>;
  generateTestData(schema: any): any;
  createSuite(name: string, tests: any[]): any;
}
