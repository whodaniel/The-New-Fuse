const enhancedResolve = require('enhanced-resolve');
const path = require('path');

const enhanced = enhancedResolve.create.sync({
  conditionNames: ['require', 'node', 'default'],
  extensions: ['.js', '.json', '.node', '.ts', '.tsx']
});

module.exports = function resolver(request, options) {
  // Custom handling for workspace packages
  if (request.startsWith('@the-new-fuse/')) {
    const packagePath = request.substring('@the-new-fuse/'.length);
    return path.resolve(__dirname, 'packages', packagePath, 'src');
  }

  // Use enhanced-resolve for everything else
  try {
    return enhanced(options.basedir, request);
  } catch (err) {
    // If resolution fails, return null to let Jest use its default behavior
    return null;
  }
}