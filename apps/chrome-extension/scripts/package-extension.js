import archiver from 'archiver';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const distName = process.env.TNF_CHROME_DIST_DIR || 'dist-v7';
const config = {
  distDir: path.join(__dirname, '..', distName),
  outputDir: path.join(__dirname, '../releases'),
  packageJsonPath: path.join(__dirname, '../package.json'),
  buildScript: process.env.TNF_CHROME_BUILD_SCRIPT || 'build:v7',
};

// Ensure directories exist
function ensureDirectories() {
  [config.distDir, config.outputDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Update version numbers
function updateVersions(version) {
  const sourceManifestPath = path.join(__dirname, '../src/v6/manifest.json');
  const distManifestPath = path.join(config.distDir, 'manifest.json');
  const manifestPath = fs.existsSync(sourceManifestPath) ? sourceManifestPath : distManifestPath;

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found for version update: ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = version;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Update package.json
  const packageJson = JSON.parse(fs.readFileSync(config.packageJsonPath, 'utf8'));
  packageJson.version = version;
  fs.writeFileSync(config.packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log(`Updated version numbers to ${version}`);
}

// Create ZIP archive
function createArchive(version) {
  const outputPath = path.join(config.outputDir, `fuse-connect-${distName}-v${version}.zip`);
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Maximum compression
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`Archive created: ${outputPath}`);
      console.log(`Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
      resolve();
    });

    archive.on('error', (err) => {
      console.error('Failed to create archive:', err);
      reject(err);
    });

    archive.pipe(output);

    // Add the dist directory contents to the ZIP
    archive.directory(config.distDir, false);

    archive.finalize();
  });
}

// Run build process
function buildExtension() {
  console.log(`Building extension with ${config.buildScript}...`);
  try {
    const runner =
      process.env.npm_execpath && path.basename(process.env.npm_execpath).includes('pnpm')
        ? 'pnpm'
        : 'npm';
    execSync(`${runner} run ${config.buildScript}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Validate the build
function validateBuild() {
  const requiredFiles = [
    'manifest.json',
    'background/index.js',
    'content/index.js',
    'popup/index.html',
    'popup/popup.js',
  ];

  const missingFiles = requiredFiles.filter(
    (file) => !fs.existsSync(path.join(config.distDir, file))
  );

  if (missingFiles.length > 0) {
    console.error('Build validation failed. Missing files:', missingFiles);
    process.exit(1);
  }

  console.log('Build validation passed');
}

// Main packaging function
async function packageExtension() {
  try {
    // Get version from package.json
    const { version } = JSON.parse(fs.readFileSync(config.packageJsonPath, 'utf8'));

    // Ensure output directories exist
    ensureDirectories();

    // Build the extension
    buildExtension();

    // Validate the build
    validateBuild();

    // Create the archive
    await createArchive(version);

    // Generate update notes
    const updateNotes =
      `Version ${version}\n` +
      `Released: ${new Date().toISOString()}\n` +
      `Build hash: ${execSync('git rev-parse HEAD').toString().trim()}\n`;

    fs.writeFileSync(path.join(config.outputDir, `release-notes-v${version}.txt`), updateNotes);

    console.log('Extension packaging completed successfully!');
  } catch (error) {
    console.error('Packaging failed:', error);
    process.exit(1);
  }
}

// If running this script directly
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  packageExtension().catch(console.error);
}

export { createArchive, packageExtension, updateVersions, validateBuild };
