### Gemini Bridge Extension - Native Host Command Injection

In `apps/gemini-bridge-extension/src/v5/native-host/tnf-native-host.js`, the native host spawned from a browser extension accepted a user-provided path and executed it via `exec(\`open "${targetPath}"\`)`. This is a classic command injection vulnerability where a maliciously crafted path could execute arbitrary shell commands.

The mitigation is replacing `exec()` with `execFile('open', [targetPath])` (imported from `child_process`). `execFile` securely passes arguments in an array, bypassing the shell evaluator and preventing injection.

Also, running `pnpm install` in this codebase can unintentionally remove large portions of `pnpm-lock.yaml`. Always verify lockfile integrity and restore it (`git checkout -- pnpm-lock.yaml`) before committing to avoid workspace regression.
