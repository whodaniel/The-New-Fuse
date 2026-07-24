const fs = require('fs');
const { exec } = require('child_process');

// Read the variables from the captured file
const vars = JSON.parse(fs.readFileSync('api_vars.json', 'utf8'));

// Keys to ignore (CloudRuntime auto-generated or handled by build args)
const ignore = ['SERVICE_PATH'];

// Filter and construct the command arguments
const args = Object.entries(vars)
  .filter(([key]) => !key.startsWith('CLOUD_RUNTIME_') && !ignore.includes(key))
  .map(([key, value]) => `--set "${key}=${value}"`)
  .join(' ');

console.log(`Generated command args for api-server-v2...`);

// Execute the CloudRuntime CLI command
// Note: We use the service name 'api-server-v2' matching the cloud_runtime.toml
exec(`cloud_runtime variables --service api-server-v2 ${args}`, (err, stdout, stderr) => {
  if (err) {
    console.error('Failed to set variables:');
    console.error(stderr);
    console.error(err.message);
    process.exit(1);
  } else {
    console.log('Successfully set variables:');
    console.log(stdout);
  }
});
