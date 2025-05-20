import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add a resolutions field to enforce consistent versions
packageJson.resolutions = {
  ...packageJson.resolutions,
  '@nestjs/common': '10.0.0',
  '@nestjs/core': '10.0.0',
  '@types/react': '18.2.0',
  'react': '18.3.1',
  'react-dom': '18.3.1',
  'reflect-metadata': '0.1.14',
  'rxjs': '7.8.1',
  'jest': '29.7.0',
  'typescript': '5.0.4'
};

// Add logic to update start:redis-monitor script to use --import for ts-node/esm
if (packageJson.scripts && packageJson.scripts['start:redis-monitor']) {
  const currentCommand = packageJson.scripts['start:redis-monitor'];
  const oldCommandRegex = /^node\s+(?:--experimental-loader|--loader)\s+ts-node\/esm\s+(.*)$/;
  const match = currentCommand.match(oldCommandRegex);

  if (match && match[1]) {
    const scriptPathAndArgs = match[1];
    const newImportDataUri = 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("ts-node/esm", pathToFileURL("./"));';
    packageJson.scripts['start:redis-monitor'] = `node --import '${newImportDataUri}' ${scriptPathAndArgs}`;
    console.log('Updated start:redis-monitor script in package.json to use --import.');
  } else if (!currentCommand.includes("--import 'data:text/javascript")) {
    console.log('start:redis-monitor script format unrecognized. Please verify manually.');
    console.log('Current command:', currentCommand);
  }
} else if (packageJson.scripts) {
  console.log('No start:redis-monitor script found in package.json.');
} else {
  console.log('No scripts section found in package.json.');
}

// Update clean scripts to be more comprehensive and safe
if (packageJson.scripts) {
  // Update the main clean script to be safer and more comprehensive
  packageJson.scripts.clean = 'yarn clean:build && yarn clean:deps && yarn clean:cache';
  
  // Add specialized clean scripts that users can run individually
  packageJson.scripts['clean:build'] = 'rimraf packages/*/{dist,build,out,.next,coverage,*.tsbuildinfo} .turbo coverage';
  packageJson.scripts['clean:deps'] = 'find . -name "node_modules" -type d -prune -exec rm -rf {} \\; 2>/dev/null || true';
  packageJson.scripts['clean:cache'] = 'yarn cache clean && rimraf .yarn/{cache,build-state.yml,install-state.gz} .parcel-cache .cache';
  packageJson.scripts['clean:docker'] = 'bash ./scripts/docker-cleanup.sh';
  packageJson.scripts['clean:all'] = 'bash ./scripts/cleanup.sh';
  
  console.log('Updated clean scripts in package.json to be more comprehensive and safe.');
}

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('Added resolutions to package.json');
