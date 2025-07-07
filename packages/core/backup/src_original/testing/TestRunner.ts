import { Logger } from 'winston';
        error: `Failed assertions: ${failedAssertions.map((a) => a.message).join(', '`'}`;
  generateReport(results: Map<string, TestResult[]>): string { let report = ''';
      report += '-'.repeat(suite.length 7) \n';
        report += ${result.success ? "✓": '✗''}
      report += '';