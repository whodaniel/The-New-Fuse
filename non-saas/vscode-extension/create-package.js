const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('Creating manual .vsix package...');

// Create output stream
const output = fs.createWriteStream('the-new-fuse-manual.vsix');
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  const size = archive.pointer();
  console.log(`Package created: the-new-fuse-manual.vsix (${size} bytes)`);
  console.log('To install: code --install-extension the-new-fuse-manual.vsix');
});

// Good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err);
  } else {
    throw err;
  }
});

// Good practice to catch this error explicitly
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files to the archive
try {
  // Required files
  archive.file('package.json', { name: 'package.json' });
  
  // Add dist directory
  if (fs.existsSync('dist')) {
    archive.directory('dist/', 'dist/');
  }
  
  // Add media directory if it exists
  if (fs.existsSync('media')) {
    archive.directory('media/', 'media/');
  }
  
  // Add README if it exists
  if (fs.existsSync('README.md')) {
    archive.file('README.md', { name: 'README.md' });
  }
  
  // Add CHANGELOG if it exists
  if (fs.existsSync('CHANGELOG.md')) {
    archive.file('CHANGELOG.md', { name: 'CHANGELOG.md' });
  }
  
  console.log('Added files to archive, finalizing...');
  
  // Finalize the archive (ie we are done appending files but streams have to finish yet)
  archive.finalize();
  
} catch (error) {
  console.error('Error creating package:', error);
  process.exit(1);
}
