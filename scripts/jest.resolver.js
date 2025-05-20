import { resolve as resolveExports } from 'enhanced-resolve';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enhanced = resolveExports.create.sync({
  conditionNames: ['require', 'node', 'default'],
  extensions: ['.js', '.json', '.node', '.ts', '.tsx']
});

export default function resolver(request, options) {
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
