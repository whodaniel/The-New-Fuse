import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the root config
import rootConfig from '../../eslint.config.js';

// Extend the root config with package-specific settings
export default [
  ...rootConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: path.resolve(__dirname, 'tsconfig.json'),
        tsconfigRootDir: __dirname
      }
    }
  }
];
