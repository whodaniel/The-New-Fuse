const fs = require('fs');
const path = require('path');

function readDeployment(fileName) {
  const deploymentPath = path.resolve(__dirname, '..', 'deployments', fileName);
  if (!fs.existsSync(deploymentPath)) return null;
  return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
}

function listDeployments() {
  const deploymentsDir = path.resolve(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) return [];
  return fs
    .readdirSync(deploymentsDir)
    .filter((entry) => entry.endsWith('.json'))
    .sort();
}

module.exports = {
  listDeployments,
  readDeployment,
};

