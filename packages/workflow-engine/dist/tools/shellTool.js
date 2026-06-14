"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShellToolInputSchema = void 0;
exports.executeShellTool = executeShellTool;
const zod_1 = require("zod");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
exports.ShellToolInputSchema = zod_1.z.object({
    command: zod_1.z.string().min(1).describe('The shell command to execute'),
    timeout: zod_1.z.number().min(1000).max(60000).default(30000).describe('Timeout in milliseconds'),
    cwd: zod_1.z.string().optional().describe('Working directory for command execution'),
});
const ALLOWED_COMMANDS = [
    /^ls/, /^cat /, /^head /, /^tail /, /^wc /, /^grep /, /^find /, /^pwd/,
    /^echo /, /^node /, /^npx /, /^pnpm /, /^npm /, /^python3? /,
    /^git status/, /^git log/, /^git diff/, /^git branch/,
    /^redis-cli /, /^curl /, /^wget /,
];
const BLOCKED_PATTERNS = [
    /rm\s+-rf\s+\//, /mkfs/, /dd\s+if=/, /:\s*\(\)\s*\{/,
    />\s*\/dev\//, /chmod\s+777/, /sudo\s+rm/,
];
function isCommandAllowed(command) {
    const trimmed = command.trim();
    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(trimmed)) {
            return { allowed: false, reason: `Command matches blocked pattern: ${pattern.source}` };
        }
    }
    for (const pattern of ALLOWED_COMMANDS) {
        if (pattern.test(trimmed)) {
            return { allowed: true };
        }
    }
    return { allowed: false, reason: 'Command not in allowed list. Add to ALLOWED_COMMANDS if safe.' };
}
async function executeShellTool(input) {
    const parsed = exports.ShellToolInputSchema.parse(input);
    const { allowed, reason } = isCommandAllowed(parsed.command);
    if (!allowed) {
        return {
            success: false,
            stdout: '',
            stderr: `Command rejected: ${reason}`,
            exitCode: 1,
            timedOut: false,
            command: parsed.command,
        };
    }
    try {
        const { stdout, stderr } = await execAsync(parsed.command, {
            timeout: parsed.timeout,
            cwd: parsed.cwd,
            maxBuffer: 1024 * 1024,
            env: { ...process.env },
        });
        return {
            success: true,
            stdout: stdout.toString(),
            stderr: stderr.toString(),
            exitCode: 0,
            timedOut: false,
            command: parsed.command,
        };
    }
    catch (error) {
        if (error.killed) {
            return {
                success: false,
                stdout: error.stdout?.toString() || '',
                stderr: 'Command timed out',
                exitCode: null,
                timedOut: true,
                command: parsed.command,
            };
        }
        return {
            success: false,
            stdout: error.stdout?.toString() || '',
            stderr: error.stderr?.toString() || error.message,
            exitCode: error.code || 1,
            timedOut: false,
            command: parsed.command,
        };
    }
}
//# sourceMappingURL=shellTool.js.map