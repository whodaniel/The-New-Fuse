const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const projectRoot = path.resolve(__dirname, '../../');
const webpackConfigPath = path.join(projectRoot, 'apps/theia-ide/webpack.config.js');
const pnpmWorkspacePath = path.join(projectRoot, 'pnpm-workspace.yaml');

console.log('Patching Theia Webpack config...');

try {
  const workspaceYaml = fs.readFileSync(pnpmWorkspacePath, 'utf8');
  const workspaceConfig = yaml.load(workspaceYaml);
  const packages = workspaceConfig.packages.map(p => p.replace('/*', ''));

  let webpackConfig = fs.readFileSync(webpackConfigPath, 'utf8');

  // Check if the patch is already applied
  if (webpackConfig.includes('// WEBPACK_PATCH_APPLIED')) {
    console.log('Webpack config already patched. Skipping.');
    process.exit(0);
  }

  const patch = `
// WEBPACK_PATCH_APPLIED
const pnpmPackages = ${JSON.stringify(packages)};
if (config.resolve.alias) {
  for (const pkg of pnpmPackages) {
    config.resolve.alias[\`@theia/\${pkg.split('/')[1]}\`] = path.resolve(__dirname, \`../../node_modules/.pnpm/node_modules/@theia/\${pkg.split('/')[1]}\`);
  }
}\n`;

  // A simple way to inject the patch. A more robust solution might use AST transforms.
  webpackConfig = webpackConfig.replace(/(module\.exports\s*=\s*{)/, `$1${patch}`);

  fs.writeFileSync(webpackConfigPath, webpackConfig, 'utf8');
  console.log('Successfully patched Theia Webpack config.');

} catch (error) {
  console.error('Failed to patch Webpack config:', error);
  process.exit(1);
}
