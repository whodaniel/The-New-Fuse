const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

// Configuration
const config = {
  distDir: path.join(__dirname, '../dist'),
  outputDir: path.join(__dirname, '../releases'),
  manifestPath: path.join(__dirname, '../manifest.json'),
  packageJsonPath: path.join(__dirname, '../package.json')
};

// Ensure directories exist
function ensureDirectories() {
  [config.distDir, config.outputDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Update version numbers
function updateVersions(version) {
  // Update manifest.json
  const manifest = JSON.parse(fs.readFileSync(config.manifestPath, 'utf8'));
  manifest.version = version;
  fs.writeFileSync(config.manifestPath, JSON.stringify(manifest, null, 2));

  // Update package.json
  const packageJson = JSON.parse(fs.readFileSync(config.packageJsonPath, 'utf8'));
  packageJson.version = version;
  fs.writeFileSync(config.packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log(`Updated version numbers to ${version}`);
}

// Create ZIP archive
function createArchive(version) {
  const outputPath = path.join(config.outputDir, `the-new-fuse-v${version}.zip`);
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
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
  console.log('Building extension...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Validate the build
function validateBuild() {
  const requiredFiles = [
    'manifest.json',
    'background.js',
    'popup.js',
    'popup.html',
    'options.js',
    'options.html',
    'content.js',
    'utils.js'
  ];

  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(config.distDir, file))
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
    const { version } = require('../package.json');

    // Ensure output directories exist
    ensureDirectories();

    // Build the extension
    buildExtension();

    // Validate the build
    validateBuild();

    // Create the archive
    await createArchive(version);

    // Generate update notes
    const updateNotes = `Version ${version}\n` +
      `Released: ${new Date().toISOString()}\n` +
      `Build hash: ${execSync('git rev-parse HEAD').toString().trim()}\n`;

    fs.writeFileSync(
      path.join(config.outputDir, `release-notes-v${version}.txt`),
      updateNotes
    );

    console.log('Extension packaging completed successfully!');
  } catch (error) {
    console.error('Packaging failed:', error);
    process.exit(1);
  }
}

// If running this script directly
if (require.main === module) {
  packageExtension().catch(console.error);
}

module.exports = {
  packageExtension,
  updateVersions,
  validateBuild,
  createArchive
};
