const fs = require('fs');
const file = 'packages/tnf-cli/src/cli.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Change function signature
code = code.replace(
  'function requireSuperAdmin(',
  'async function requireSuperAdmin('
);

// 2. Add await to all calls
code = code.replace(
  /requireSuperAdmin\(/g,
  (match, offset) => {
    // skip the function definition itself
    if (code.slice(offset - 15, offset) === 'async function ') return match;
    return 'await ' + match;
  }
);

fs.writeFileSync(file, code);
