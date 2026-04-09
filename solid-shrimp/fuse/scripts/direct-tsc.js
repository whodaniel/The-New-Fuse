#!/usr/bin/env node
import { spawnSync  } from 'child_process';
import fs from 'fs';

// Install TypeScript directly with npm
spawnSync('npm', ['install', '--no-save', 'typescript@5.3.3', '--force'], { 
  stdio: 'inherit',
  shell: true 
});

// Create a minimal tsconfig if needed
if (!fs.existsSync('tsconfig-minimal.json')) {
  fs.writeFileSync('tsconfig-minimal.json', JSON.stringify({
    compilerOptions: {
      target: "es2016",
      module: "commonjs",
      esModuleInterop: true,
      skipLibCheck: true,
      strict: false,
      noImplicitAny: false
    },
    include: ["src/**/*"],
    exclude: ["node_modules"]
  }, null, 2));
}

// Run TypeScript check
spawnSync('npx', ['tsc', '--project', 'tsconfig-minimal.json', '--noEmit'], {
  stdio: 'inherit',
  shell: true
});
