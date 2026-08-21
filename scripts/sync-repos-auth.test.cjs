const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, 'sync-repos.sh'), 'utf8');

test('publication URLs never interpolate GitHub credentials', () => {
  assert.doesNotMatch(source, /https?:\/\/[^"'\s]*(?:GITHUB_PAT|GH_TOKEN)/);
  assert.doesNotMatch(source, /x-access-token:\$\{/);
  assert.doesNotMatch(source, /https:\/\/\$\{GITHUB_PAT\}@/);
});

test('git authentication uses an environment-expanded credential helper', () => {
  assert.match(source, /GIT_CREDENTIAL_HELPER=/);
  assert.match(source, /password=\$GITHUB_PAT/);
  assert.match(source, /git_authenticated clone/);
  assert.match(source, /git_authenticated push/);
});

test('public overlay preserves the tip without downloading discarded blobs', () => {
  assert.match(
    source,
    /git_authenticated clone --filter=tree:0 --no-checkout --depth 1 \"\$OPEN_REMOTE\" \"\$OPEN_DIR\"/,
  );
  assert.match(source, /NEW_TREE=\$\(git write-tree\)/);
  assert.match(source, /git commit-tree \"\$NEW_TREE\" -p \"\$PUBLIC_HEAD\"/);
});

test('generated publication commits and pull requests use conventional titles', () => {
  assert.match(source, /COMMIT_MESSAGE="chore\(sync\): publish open runtime/);
  assert.match(source, /PUBLIC_PR_TITLE="chore\(sync\): publish open runtime/);
  assert.doesNotMatch(source, /(?:COMMIT_MESSAGE=|--title )"sync:/);
  assert.match(source, /gh_authenticated pr edit "\$SYNC_BRANCH"/);
});
