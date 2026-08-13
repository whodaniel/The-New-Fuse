const { execFileSync } = require('node:child_process');
const path = require('node:path');

/**
 * Prettier-only lint-staged config.
 * Skip gitignored / never-index paths so `git add` after format cannot fail
 * when force-tracked ignored files land in a commit (skill-bank, node_modules, etc.).
 */
function isIgnored(file) {
  try {
    // --no-index: force-tracked files can still match .gitignore rules.
    // Without it, lint-staged re-`git add`s ignored paths and the hook fails.
    execFileSync('git', ['check-ignore', '-q', '--no-index', '--', file], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function quote(file) {
  // Preserve spaces for shell command string form.
  return `"${file.replace(/"/g, '\\"')}"`;
}

function prettierOnly(filenames) {
  const files = filenames.map((f) => path.normalize(f)).filter((f) => f && !isIgnored(f));
  if (files.length === 0) return [];
  return [`prettier --write ${files.map(quote).join(' ')}`];
}

module.exports = {
  '*.{ts,tsx,js,jsx}': prettierOnly,
  '*.json': prettierOnly,
  '*.md': prettierOnly,
  '*.{yml,yaml}': prettierOnly,
  '*.{css,scss,less}': prettierOnly,
  'package.json': prettierOnly,
};
