/**
 * Load Test Runner Script
 * 
 * This script runs load tests using the LoadTestingService.
 * It can be configured via command line arguments or a configuration file.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Default configuration
const defaultConfig = {
  tests: [
    {
      name: 'API Health Check',
      url: 'http://localhost:3000/api/health',
      method: 'GET',
      duration: 30,
      rate: 50,
      connections: 10,
      assertions: {
        responseTime: 200,
        statusCode: 200,
        failureRate: 0.01
      }
    }
  ],
  outputDir: 'test-results/load-tests',
  parallel: false,
  verbose: true
};

// Parse command line arguments
const args = process.argv.slice(2);
let configPath = 'load-test-config.json';
let selectedTests = [];
let verbose = defaultConfig.verbose;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--config' && i + 1 < args.length) {
    configPath = args[i + 1];
    i++;
  } else if (args[i] === '--test' && i + 1 < args.length) {
    selectedTests.push(args[i + 1]);
    i++;
  } else if (args[i] === '--verbose') {
    verbose = true;
  } else if (args[i] === '--quiet') {
    verbose = false;
  }
}

// Load configuration
let config = { ...defaultConfig };
if (fs.existsSync(configPath)) {
  try {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...fileConfig };
  } catch (error) {
    console.error(`Error loading configuration from ${configPath}:`, error.message);
    process.exit(1);
  }
}

// Filter tests if specific ones were selected
if (selectedTests.length > 0) {
  config.tests = config.tests.filter(test => selectedTests.includes(test.name));
  if (config.tests.length === 0) {
    console.error('No matching tests found for the specified names.');
    process.exit(1);
  }
}

// Ensure output directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Check if k6 is installed
try {
  execSync('k6 version', { stdio: 'ignore' });
} catch (error) {
  console.error('k6 is not installed or not in PATH. Please install k6: https://k6.io/docs/getting-started/installation/');
  process.exit(1);
}

// Run tests
console.log(`Running ${config.tests.length} load tests...`);

const results = [];

for (const test of config.tests) {
  console.log(`\nRunning test: ${test.name}`);
  
  // Generate k6 script
  const scriptContent = `
    import http from 'k6/http';
    import { check, sleep } from 'k6';
    
    export const options = {
      vus: ${test.connections},
      duration: '${test.duration}s',
      thresholds: {
        http_req_duration: ['p(95)<${test.assertions?.responseTime || 500}'],
        http_req_failed: ['rate<${(test.assertions?.failureRate || 0.01) * 100}%']
      }
    };
    
    export default function() {
      const url = '${test.url}';
      const params = {
        headers: ${JSON.stringify(test.headers || {})},
      };
      
      ${test.body ? `const payload = ${JSON.stringify(test.body)};` : ''}
      
      const response = http.${test.method.toLowerCase()}(url, ${test.body ? 'payload, ' : ''}params);
      
      check(response, {
        'status is ${test.assertions?.statusCode || 200}': (r) => r.status === ${test.assertions?.statusCode || 200},
      });
      
      sleep(1 / ${test.rate});
    }
  `;
  
  const scriptPath = path.join(config.outputDir, `${test.name.replace(/\s+/g, '-').toLowerCase()}.js`);
  fs.writeFileSync(scriptPath, scriptContent);
  
  // Run k6
  try {
    const outputPath = path.join(config.outputDir, `${test.name.replace(/\s+/g, '-').toLowerCase()}-result.json`);
    const command = `k6 run ${scriptPath} --summary-export=${outputPath}`;
    
    if (verbose) {
      console.log(`Executing: ${command}`);
    }
    
    const output = execSync(command, { encoding: 'utf8' });
    
    if (verbose) {
      console.log(output);
    }
    
    // Parse results
    const resultJson = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    
    const result = {
      name: test.name,
      url: test.url,
      method: test.method,
      duration: test.duration,
      connections: test.connections,
      rate: test.rate,
      metrics: {
        http_req_duration: {
          avg: resultJson.metrics.http_req_duration.avg,
          min: resultJson.metrics.http_req_duration.min,
          max: resultJson.metrics.http_req_duration.max,
          p95: resultJson.metrics.http_req_duration.p(95),
          p99: resultJson.metrics.http_req_duration.p(99)
        },
        http_reqs: resultJson.metrics.http_reqs.count,
        http_req_failed: resultJson.metrics.http_req_failed.rate
      },
      assertions: {
        responseTime: {
          passed: resultJson.metrics.http_req_duration.p(95) < (test.assertions?.responseTime || 500),
          actual: resultJson.metrics.http_req_duration.p(95),
          expected: test.assertions?.responseTime || 500
        },
        failureRate: {
          passed: resultJson.metrics.http_req_failed.rate < (test.assertions?.failureRate || 0.01) * 100,
          actual: resultJson.metrics.http_req_failed.rate,
          expected: (test.assertions?.failureRate || 0.01) * 100
        }
      },
      passed: true
    };
    
    // Check if test passed
    result.passed = result.assertions.responseTime.passed && result.assertions.failureRate.passed;
    
    results.push(result);
    
    console.log(`Test ${test.name} ${result.passed ? 'PASSED' : 'FAILED'}`);
    
  } catch (error) {
    console.error(`Error running test ${test.name}:`, error.message);
    
    results.push({
      name: test.name,
      url: test.url,
      method: test.method,
      error: error.message,
      passed: false
    });
  }
}

// Generate summary report
const summary = {
  timestamp: new Date().toISOString(),
  totalTests: results.length,
  passedTests: results.filter(r => r.passed).length,
  failedTests: results.filter(r => !r.passed).length,
  results
};

const summaryPath = path.join(config.outputDir, 'summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

// Generate HTML report
const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Load Test Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { margin-bottom: 20px; }
    .test { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
    .test h2 { margin-top: 0; }
    .passed { color: green; }
    .failed { color: red; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Load Test Results</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Timestamp: ${summary.timestamp}</p>
    <p>Total Tests: ${summary.totalTests}</p>
    <p>Passed Tests: <span class="passed">${summary.passedTests}</span></p>
    <p>Failed Tests: <span class="failed">${summary.failedTests}</span></p>
  </div>
  
  ${results.map(result => `
    <div class="test">
      <h2>${result.name} <span class="${result.passed ? 'passed' : 'failed'}">${result.passed ? 'PASSED' : 'FAILED'}</span></h2>
      <p>URL: ${result.url}</p>
      <p>Method: ${result.method}</p>
      ${result.error ? `<p class="failed">Error: ${result.error}</p>` : ''}
      
      ${!result.error ? `
        <h3>Metrics</h3>
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Total Requests</td>
            <td>${result.metrics.http_reqs}</td>
          </tr>
          <tr>
            <td>Failure Rate</td>
            <td>${result.metrics.http_req_failed}%</td>
          </tr>
          <tr>
            <td>Avg Response Time</td>
            <td>${result.metrics.http_req_duration.avg.toFixed(2)} ms</td>
          </tr>
          <tr>
            <td>Min Response Time</td>
            <td>${result.metrics.http_req_duration.min.toFixed(2)} ms</td>
          </tr>
          <tr>
            <td>Max Response Time</td>
            <td>${result.metrics.http_req_duration.max.toFixed(2)} ms</td>
          </tr>
          <tr>
            <td>P95 Response Time</td>
            <td>${result.metrics.http_req_duration.p95.toFixed(2)} ms</td>
          </tr>
          <tr>
            <td>P99 Response Time</td>
            <td>${result.metrics.http_req_duration.p99.toFixed(2)} ms</td>
          </tr>
        </table>
        
        <h3>Assertions</h3>
        <table>
          <tr>
            <th>Assertion</th>
            <th>Expected</th>
            <th>Actual</th>
            <th>Result</th>
          </tr>
          <tr>
            <td>Response Time (P95)</td>
            <td>&lt; ${result.assertions.responseTime.expected} ms</td>
            <td>${result.assertions.responseTime.actual.toFixed(2)} ms</td>
            <td class="${result.assertions.responseTime.passed ? 'passed' : 'failed'}">${result.assertions.responseTime.passed ? 'PASSED' : 'FAILED'}</td>
          </tr>
          <tr>
            <td>Failure Rate</td>
            <td>&lt; ${result.assertions.failureRate.expected}%</td>
            <td>${result.assertions.failureRate.actual}%</td>
            <td class="${result.assertions.failureRate.passed ? 'passed' : 'failed'}">${result.assertions.failureRate.passed ? 'PASSED' : 'FAILED'}</td>
          </tr>
        </table>
      ` : ''}
    </div>
  `).join('')}
</body>
</html>
`;

const htmlReportPath = path.join(config.outputDir, 'report.html');
fs.writeFileSync(htmlReportPath, htmlReport);

console.log(`\nLoad test summary:`);
console.log(`Total Tests: ${summary.totalTests}`);
console.log(`Passed Tests: ${summary.passedTests}`);
console.log(`Failed Tests: ${summary.failedTests}`);
console.log(`\nReports saved to:`);
console.log(`- Summary JSON: ${summaryPath}`);
console.log(`- HTML Report: ${htmlReportPath}`);

// Exit with appropriate code
process.exit(summary.failedTests > 0 ? 1 : 0);
