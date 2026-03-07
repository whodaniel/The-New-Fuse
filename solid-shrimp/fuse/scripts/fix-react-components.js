import fs from 'fs';
import path from 'path';

function fixReactComponent(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add proper React imports
  if (!content.includes('import React')) {
    content = `import React from 'react';\n${content}`;
  }
  
  // Fix component props typing
  content = content.replace(
    /interface (\w+)Props {/g,
    'interface $1Props extends React.PropsWithChildren<{',
  );
  
  // Fix component declarations
  content = content.replace(
    /function (\w+)\((props: \w+Props)\)/g,
    'const $1: React.FC<$2> = ($2)',
  );
  
  // Add proper exports
  if (!content.includes('export default')) {
    content += '\nexport default React.memo(ComponentName);\n';
  }
  
  fs.writeFileSync(filePath, content);
}

// Process all React components
const componentFiles = process.argv.slice(2);
componentFiles.forEach(fixReactComponent);