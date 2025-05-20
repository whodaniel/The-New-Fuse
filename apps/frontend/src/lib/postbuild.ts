import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

renameSync(path.resolve(__dirname, '../dist/index.html'), path.resolve(__dirname, '../dist/_index.html'));

//# sourceMappingURL=postbuild.js.map