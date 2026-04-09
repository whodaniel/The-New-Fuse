import fs from 'fs';
import path from 'path';

// Function to recursively walk through directories
const walkSync = (dir, filelist = []): any => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else if (file.endsWith('.js') && !fs.existsSync(`${filepath}.map`)) {
      
      // Create a basic source map
      const sourceFile = file.replace('.js', '.tsx');
      if (fs.existsSync(path.join(dir, sourceFile))) {
        const sourceMap = {
          version: 3,
          file: file,
          sources: [sourceFile],
          names: [],
          mappings: '',
          sourceRoot: ''
        };
        fs.writeFileSync(`${filepath}.map`, JSON.stringify(sourceMap));
      } else {
        // Try with .ts extension
        const tsSourceFile = file.replace('.js', '.ts');
        if (fs.existsSync(path.join(dir, tsSourceFile))) {
          const sourceMap = {
            version: 3,
            file: file,
            sources: [tsSourceFile],
            names: [],
            mappings: '',
            sourceRoot: ''
          };
          fs.writeFileSync(`${filepath}.map`, JSON.stringify(sourceMap));
        } else {
          // If no source file found, use the js file itself
          const sourceMap = {
            version: 3,
            file: file,
            sources: [file],
            names: [],
            mappings: '',
            sourceRoot: ''
          };
          fs.writeFileSync(`${filepath}.map`, JSON.stringify(sourceMap));
        }
      }
    }
  });
  return filelist;
};

// Start from the src directory
const srcDir = path.join(process.cwd(), 'src');

walkSync(srcDir);
