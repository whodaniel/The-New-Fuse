import * as fs from 'fs';
import * as path from 'path';

const ROOT_MARKERS = ['pnpm-workspace.yaml', 'turbo.json'];

export function resolveCodebaseRoot(): string {
  const envRoot = process.env.TNF_CODEBASE_ROOT;
  if (envRoot) {
    return envRoot;
  }

  let current = process.cwd();
  for (let i = 0; i < 10; i += 1) {
    if (ROOT_MARKERS.some((marker) => fs.existsSync(path.join(current, marker)))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return process.cwd();
}
