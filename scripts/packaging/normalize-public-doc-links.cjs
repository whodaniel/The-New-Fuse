#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Publication-only transform. Source documents and local inventories remain intact.
function normalizePublicDocLinks(root) {
  root = fs.realpathSync(root);
  let changed = 0;
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || ['.git', 'node_modules'].includes(entry.name)) continue;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(file);
        continue;
      }
      if (!entry.isFile() || !file.endsWith('.md')) continue;
      const before = fs.readFileSync(file, 'utf8');
      const after = before.replace(
        /file:\/\/\/Users\/[^\s)]+\/(?:The-New-Fuse|tnf-monorepo)\/([^\s)]+)/g,
        (original, suffix) => {
          const [relativeTarget] = suffix.split(/[?#]/);
          const target = path.resolve(root, relativeTarget);
          // Missing/excluded targets and traversal remain untouched and fail the existing gate.
          if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) return original;
          const resolved = fs.realpathSync(target);
          if (!resolved.startsWith(root + path.sep)) return original;
          return (
            path.relative(path.dirname(file), target).split(path.sep).join('/') +
            suffix.slice(relativeTarget.length)
          );
        }
      );
      if (after !== before) {
        fs.writeFileSync(file, after);
        changed++;
      }
    }
  }
  visit(root);
  return changed;
}

if (require.main === module) {
  if (!process.argv[2]) throw new Error('Usage: normalize-public-doc-links.cjs <export-directory>');
  console.log(
    `Normalized repository links in ${normalizePublicDocLinks(process.argv[2])} public documents`
  );
}
module.exports = { normalizePublicDocLinks };
