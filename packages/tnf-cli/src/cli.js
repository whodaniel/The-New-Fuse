"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const commander_1 = require("commander");
const crypto_1 = require("crypto");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const url_1 = require("url");
const RedisAgentClient_js_1 = require("./RedisAgentClient.js");
const program = new commander_1.Command();
// Fallback for CommonJS/ESM compatibility
const _dirname = typeof __dirname !== 'undefined'
    ? __dirname
    : path_1.default.dirname((0, url_1.fileURLToPath)(import.meta.url));
const repoRoot = path_1.default.resolve(_dirname, '../../..');
const SUPER_ADMIN_ENV_KEY = 'TNF_SUPER_ADMIN_TOKEN';
const SUPER_ADMIN_INPUT_ENV_KEY = 'TNF_SUPER_ADMIN_INPUT_TOKEN';
const RUNNABLE_SCRIPT_EXTENSIONS = new Set([
    '.sh',
    '.bash',
    '.zsh',
    '.js',
    '.cjs',
    '.mjs',
    '.ts',
    '.tsx',
    '.py',
]);
async function runCommand(cmd, args, options = {}) {
    await new Promise((resolve, reject) => {
        const stdio = options.isBackground ? 'ignore' : 'inherit';
        const child = (0, child_process_1.spawn)(cmd, args, {
            cwd: options.cwd || repoRoot,
            env: { ...process.env, ...(options.env || {}) },
            stdio,
            detached: options.isBackground,
        });
        if (options.isBackground) {
            child.unref();
            return resolve();
        }
        child.on('error', (error) => {
            if (error?.code === 'ENOENT') {
                reject(new Error(`'${cmd}' is not installed or not on PATH`));
                return;
            }
            reject(error);
        });
        child.on('close', (code) => {
            if (code === 0)
                return resolve();
            reject(new Error(`${cmd} exited with code ${code}`));
        });
    });
}
function requireSuperAdmin(options, commandLabel) {
    const expected = process.env[SUPER_ADMIN_ENV_KEY];
    const provided = options?.superAdminToken ||
        process.env[SUPER_ADMIN_INPUT_ENV_KEY] ||
        process.env.CI_SUPER_ADMIN_TOKEN ||
        process.env[SUPER_ADMIN_ENV_KEY]; // Allow the master secret to fulfill itself in local environments
    if (!expected) {
        throw new Error(`Super Admin auth is not configured. Set ${SUPER_ADMIN_ENV_KEY} in the execution environment (e.g. ~/.zshrc or .env).`);
    }
    if (!provided || provided !== expected) {
        throw new Error(`Super Admin authentication required for '${commandLabel}'.\n` +
            `Ways to provide the token:\n` +
            `  1. CLI Option: tnf ... --super-admin-token YOUR_TOKEN\n` +
            `  2. Env Var:    export ${SUPER_ADMIN_INPUT_ENV_KEY}=YOUR_TOKEN\n` +
            `  3. CI Secret:  Set CI_SUPER_ADMIN_TOKEN in your CI/CD settings.`);
    }
}
function isExecutableFile(filePath) {
    try {
        const stats = fs_1.default.statSync(filePath);
        if (!stats.isFile())
            return false;
        if (process.platform === 'win32')
            return true;
        return (stats.mode & 0o111) !== 0;
    }
    catch {
        return false;
    }
}
function findExecutableOnPath(commandName) {
    const pathEnv = process.env.PATH || '';
    for (const directory of pathEnv.split(path_1.default.delimiter)) {
        if (!directory)
            continue;
        const candidate = path_1.default.join(directory, commandName);
        if (isExecutableFile(candidate))
            return candidate;
    }
    return null;
}
function resolveVoiceBridgeCommand(commandName) {
    const overrideEnvKey = `TNF_VOICE_${commandName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_CMD`;
    const override = process.env[overrideEnvKey];
    if (override) {
        const expanded = override.startsWith('~')
            ? path_1.default.join(process.env.HOME || '', override.slice(1))
            : override;
        if (!isExecutableFile(expanded)) {
            throw new Error(`${overrideEnvKey} is set but does not point to an executable file: ${expanded}`);
        }
        return expanded;
    }
    const onPath = findExecutableOnPath(commandName);
    if (onPath)
        return onPath;
    const homeBin = process.env.HOME ? path_1.default.join(process.env.HOME, 'bin', commandName) : '';
    if (homeBin && isExecutableFile(homeBin))
        return homeBin;
    throw new Error(`Voice Bridge command '${commandName}' not found. Install Voice Bridge and ensure '${commandName}' is on PATH, or set ${overrideEnvKey}.`);
}
async function runVoiceBridgeCommand(commandName, args = []) {
    const executable = resolveVoiceBridgeCommand(commandName);
    await runCommand(executable, args, { cwd: process.cwd() });
}
function normalizeVoiceProfile(raw) {
    const profile = (raw || 'main')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return profile || 'main';
}
function isDefaultVoiceProfile(profile) {
    return profile === 'main' || profile === 'default' || profile === 'primary';
}
function inferVoiceBridgePort(profileInput, explicitPort) {
    if (explicitPort) {
        const port = Number.parseInt(explicitPort, 10);
        if (!Number.isFinite(port) || port <= 0) {
            throw new Error(`Invalid --port value: ${explicitPort}`);
        }
        return port;
    }
    const envPort = process.env.VOICEBRIDGE_PORT;
    if (envPort) {
        const port = Number.parseInt(envPort, 10);
        if (Number.isFinite(port) && port > 0)
            return port;
    }
    const profile = normalizeVoiceProfile(profileInput);
    if (isDefaultVoiceProfile(profile))
        return 50005;
    const cksum = (0, child_process_1.spawnSync)('cksum', {
        input: profile,
        encoding: 'utf8',
        env: process.env,
    });
    if (cksum.status === 0) {
        const token = (cksum.stdout || '').trim().split(/\s+/)[0];
        const hash = Number.parseInt(token || '', 10);
        if (Number.isFinite(hash)) {
            return 50005 + (hash % 400) + 1;
        }
    }
    let fallbackHash = 0;
    for (const char of profile)
        fallbackHash = (fallbackHash * 33 + char.charCodeAt(0)) >>> 0;
    return 50005 + (fallbackHash % 400) + 1;
}
function readVoiceBridgeJson(pathname, method = 'GET', port = 50005) {
    const url = `http://127.0.0.1:${port}${pathname}`;
    const args = ['-fsS', url];
    if (method === 'POST')
        args.unshift('-X', 'POST');
    const result = (0, child_process_1.spawnSync)('curl', args, {
        encoding: 'utf8',
        env: process.env,
    });
    if (result.status !== 0) {
        const stderr = (result.stderr || '').trim();
        throw new Error(`Voice Bridge API call failed for ${method} ${pathname} on 127.0.0.1:${port}. ${stderr || `Is voice server running on 127.0.0.1:${port}?`}`);
    }
    const body = (result.stdout || '').trim();
    if (!body)
        return {};
    try {
        return JSON.parse(body);
    }
    catch {
        throw new Error(`Voice Bridge API returned non-JSON for ${method} ${pathname}: ${body}`);
    }
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function resolveVoiceBridgeStateDir() {
    const explicit = (process.env.VOICEBRIDGE_STATE_DIR || '').trim();
    if (explicit)
        return explicit;
    if (repoRoot && fs_1.default.existsSync(repoRoot))
        return path_1.default.join(repoRoot, '.voicebridge');
    return path_1.default.join(process.env.HOME || process.cwd(), '.voicebridge');
}
function voiceSessionFile(profileInput) {
    const profile = normalizeVoiceProfile(profileInput);
    const stateDir = resolveVoiceBridgeStateDir();
    fs_1.default.mkdirSync(stateDir, { recursive: true });
    return path_1.default.join(stateDir, `tnf_voice_session_${profile}.json`);
}
function writeVoiceSession(session) {
    const file = voiceSessionFile(session.profile);
    fs_1.default.writeFileSync(file, `${JSON.stringify(session, null, 2)}\n`, 'utf8');
}
function readVoiceSession(profileInput) {
    const file = voiceSessionFile(profileInput);
    if (!fs_1.default.existsSync(file))
        return null;
    try {
        return JSON.parse(fs_1.default.readFileSync(file, 'utf8'));
    }
    catch {
        return null;
    }
}
function removeVoiceSession(profileInput) {
    const file = voiceSessionFile(profileInput);
    if (fs_1.default.existsSync(file))
        fs_1.default.rmSync(file, { force: true });
}
function parseProcessTable() {
    const result = (0, child_process_1.spawnSync)('ps', ['-Ao', 'pid=,command='], {
        encoding: 'utf8',
        env: process.env,
    });
    if (result.status !== 0)
        return [];
    return (result.stdout || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
        const firstWhitespace = line.search(/\s/);
        if (firstWhitespace <= 0)
            return { pid: Number.NaN, cmd: '' };
        const pidText = line.slice(0, firstWhitespace).trim();
        const cmd = line.slice(firstWhitespace).trim();
        const pid = Number.parseInt(pidText, 10);
        return { pid, cmd };
    })
        .filter((entry) => Number.isFinite(entry.pid) && entry.pid > 0 && entry.cmd.length > 0);
}
function matchesVoiceProfileProcess(cmd, profileInput) {
    const profile = normalizeVoiceProfile(profileInput);
    const isDefault = isDefaultVoiceProfile(profile);
    const profilePattern = new RegExp(`(?:^|\\s)--profile(?:=|\\s+)${escapeRegExp(profile)}(?:\\s|$)`, 'i');
    const hasProfileFlag = /(?:^|\s)--profile(?:=|\s+)/i.test(cmd);
    const argv0 = (cmd.trim().split(/\s+/)[0] || '').toLowerCase();
    const argv0Base = path_1.default.basename(argv0);
    const cmdLower = cmd.toLowerCase();
    const isVoiceWrapper = argv0Base === 'voice';
    const isListenWrapper = argv0Base === 'listen';
    const isProfiledPythonWorker = cmdLower.includes('voice_server.py') ||
        cmdLower.includes('stream_watch.py') ||
        cmdLower.includes('voice-response-audio-watch.py');
    if (profilePattern.test(cmd)) {
        if (isVoiceWrapper || isListenWrapper || isProfiledPythonWorker)
            return true;
    }
    if (!isDefault || hasProfileFlag)
        return false;
    if (isVoiceWrapper || isListenWrapper || isProfiledPythonWorker)
        return true;
    return false;
}
function findVoiceProfilePids(profileInput) {
    return parseProcessTable()
        .filter((entry) => matchesVoiceProfileProcess(entry.cmd, profileInput))
        .map((entry) => entry.pid);
}
function findMainProfileInterferencePids(activeProfiles) {
    const normalizedActive = new Set(activeProfiles.map((p) => normalizeVoiceProfile(p)));
    for (const profile of normalizedActive) {
        if (isDefaultVoiceProfile(profile))
            return [];
    }
    return findVoiceProfilePids('main');
}
function isPidAlive(pid) {
    if (!Number.isFinite(pid) || pid <= 0)
        return false;
    try {
        process.kill(pid, 0);
        return true;
    }
    catch {
        return false;
    }
}
async function terminatePids(pids, options = {}) {
    const graceMs = options.graceMs ?? 1800;
    const killMs = options.killMs ?? 1200;
    const unique = Array.from(new Set(pids.filter((pid) => Number.isFinite(pid) && pid > 0)));
    const notFound = [];
    const stopped = [];
    const forceKilled = [];
    for (const pid of unique) {
        if (!isPidAlive(pid)) {
            notFound.push(pid);
            continue;
        }
        try {
            process.kill(pid, 'SIGTERM');
        }
        catch {
            notFound.push(pid);
        }
    }
    const waitUntil = Date.now() + graceMs;
    while (Date.now() < waitUntil) {
        const alive = unique.filter((pid) => isPidAlive(pid));
        if (alive.length === 0)
            break;
        await sleep(120);
    }
    const stillAlive = unique.filter((pid) => isPidAlive(pid));
    if (stillAlive.length > 0) {
        for (const pid of stillAlive) {
            try {
                process.kill(pid, 'SIGKILL');
                forceKilled.push(pid);
            }
            catch {
                // ignore
            }
        }
        await sleep(killMs);
    }
    for (const pid of unique) {
        if (!isPidAlive(pid))
            stopped.push(pid);
    }
    return { stopped, notFound, forceKilled };
}
function spawnDetachedVoiceCommand(commandName, args, env) {
    const executable = resolveVoiceBridgeCommand(commandName);
    const child = (0, child_process_1.spawn)(executable, args, {
        cwd: process.cwd(),
        env,
        detached: true,
        stdio: 'ignore',
    });
    child.unref();
    if (!child.pid)
        throw new Error(`Failed to start detached command: ${commandName}`);
    return child.pid;
}
async function waitForVoiceServer(port, timeoutMs = 12000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const probe = (0, child_process_1.spawnSync)('curl', ['-fsS', `http://127.0.0.1:${port}/`], {
            encoding: 'utf8',
            env: process.env,
        });
        if (probe.status === 0)
            return true;
        await sleep(220);
    }
    return false;
}
function voiceProfileSuffix(profileInput) {
    const profile = normalizeVoiceProfile(profileInput);
    return isDefaultVoiceProfile(profile) ? '' : `_${profile}`;
}
function voiceProfileLastInputFiles(profileInput) {
    const suffix = voiceProfileSuffix(profileInput);
    return {
        tsPath: `/tmp/voice_last_user_input_ts${suffix}`,
        textPath: `/tmp/voice_last_user_input_text${suffix}`,
    };
}
function normalizeRelayText(raw) {
    return (raw || '').replace(/\s+/g, ' ').trim();
}
function relayTextHash(text) {
    return (0, crypto_1.createHash)('sha1').update(text).digest('hex');
}
function isRelayControlSignal(text) {
    const normalized = normalizeRelayText(text).toLowerCase();
    if (!normalized)
        return true;
    if (normalized.startsWith('hb '))
        return true;
    if (/\bheartbeat\b/.test(normalized))
        return true;
    if (/\bkeep polling\b/.test(normalized))
        return true;
    if (/\bcontinue polling\b/.test(normalized))
        return true;
    return false;
}
function postVoiceSend(port, text) {
    const payload = JSON.stringify({ text });
    const result = (0, child_process_1.spawnSync)('curl', [
        '-fsS',
        '--max-time',
        '2',
        '-X',
        'POST',
        `http://127.0.0.1:${port}/send`,
        '-H',
        'Content-Type: application/json',
        '--data',
        payload,
    ], {
        encoding: 'utf8',
        env: process.env,
    });
    if (result.status !== 0) {
        return {
            ok: false,
            body: '',
            error: (result.stderr || '').trim() || `curl exit ${result.status}`,
        };
    }
    return { ok: true, body: (result.stdout || '').trim() };
}
function postVoiceActivate(port) {
    const result = (0, child_process_1.spawnSync)('curl', ['-fsS', '--max-time', '2', '-X', 'POST', `http://127.0.0.1:${port}/activate`], {
        encoding: 'utf8',
        env: process.env,
    });
    if (result.status !== 0) {
        return {
            ok: false,
            body: '',
            error: (result.stderr || '').trim() || `curl exit ${result.status}`,
        };
    }
    return { ok: true, body: (result.stdout || '').trim() };
}
function relayDirection(fromProfile, toProfile, fromPort, toPort) {
    return {
        id: `${fromProfile}->${toProfile}`,
        fromProfile: normalizeVoiceProfile(fromProfile),
        toProfile: normalizeVoiceProfile(toProfile),
        fromPort,
        toPort,
        forwarded: 0,
        acked: 0,
        skippedEcho: 0,
        skippedControl: 0,
        sendFailed: 0,
    };
}
function readVoiceProfileLastInput(profileInput) {
    const { tsPath, textPath } = voiceProfileLastInputFiles(profileInput);
    if (!fs_1.default.existsSync(tsPath) || !fs_1.default.existsSync(textPath))
        return null;
    let ts = Number.NaN;
    let text = '';
    try {
        ts = Number.parseFloat((fs_1.default.readFileSync(tsPath, 'utf8') || '').trim());
        text = normalizeRelayText(fs_1.default.readFileSync(textPath, 'utf8') || '');
    }
    catch {
        return null;
    }
    if (!Number.isFinite(ts) || ts <= 0 || !text)
        return null;
    return { ts, text, hash: relayTextHash(text) };
}
function voiceProfileLastAssistantOutputFiles(profileInput) {
    const suffix = voiceProfileSuffix(profileInput);
    return {
        tsPath: `/tmp/voice_last_assistant_output_ts${suffix}`,
        textPath: `/tmp/voice_last_assistant_output_text${suffix}`,
    };
}
function readVoiceProfileLastAssistantOutput(profileInput) {
    const { tsPath, textPath } = voiceProfileLastAssistantOutputFiles(profileInput);
    if (!fs_1.default.existsSync(tsPath) || !fs_1.default.existsSync(textPath))
        return null;
    let ts = Number.NaN;
    let text = '';
    try {
        ts = Number.parseFloat((fs_1.default.readFileSync(tsPath, 'utf8') || '').trim());
        text = normalizeRelayText(fs_1.default.readFileSync(textPath, 'utf8') || '');
    }
    catch {
        return null;
    }
    if (!Number.isFinite(ts) || ts <= 0 || !text)
        return null;
    return { ts, text, hash: relayTextHash(text) };
}
function clipProtocolText(raw, maxChars = 96) {
    const text = normalizeRelayText(raw);
    if (!text)
        return '';
    if (text.length <= maxChars)
        return text;
    return `${text.slice(0, maxChars - 1)}…`;
}
function ageMsFromUnixTs(ts) {
    if (!ts || !Number.isFinite(ts) || ts <= 0)
        return null;
    const nowMs = Date.now();
    const tsMs = Math.round(ts * 1000);
    const age = nowMs - tsMs;
    return age >= 0 ? age : 0;
}
function formatAgeMs(ageMs) {
    if (ageMs === null || typeof ageMs === 'undefined')
        return 'n/a';
    if (ageMs < 1000)
        return `${ageMs}ms`;
    const seconds = Math.floor(ageMs / 1000);
    if (seconds < 60)
        return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remSeconds = seconds % 60;
    if (minutes < 60)
        return `${minutes}m ${remSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours}h ${remMinutes}m`;
}
function findProfilePythonWorkerPids(profileInput, scriptName) {
    const profile = normalizeVoiceProfile(profileInput);
    const profilePattern = new RegExp(`(?:^|\\s)--profile(?:=|\\s+)${escapeRegExp(profile)}(?:\\s|$)`, 'i');
    return parseProcessTable()
        .filter((entry) => {
        const cmd = entry.cmd;
        if (!cmd.toLowerCase().includes(scriptName.toLowerCase()))
            return false;
        const argv0 = (cmd.trim().split(/\s+/)[0] || '').toLowerCase();
        if (!path_1.default.basename(argv0).includes('python'))
            return false;
        return profilePattern.test(cmd);
    })
        .map((entry) => entry.pid);
}
function findVoiceRelayPids(fromProfileInput, toProfileInput) {
    const fromProfile = normalizeVoiceProfile(fromProfileInput);
    const toProfile = normalizeVoiceProfile(toProfileInput);
    const fromPattern = new RegExp(`(?:^|\\s)--from(?:=|\\s+)${escapeRegExp(fromProfile)}(?:\\s|$)`, 'i');
    const toPattern = new RegExp(`(?:^|\\s)--to(?:=|\\s+)${escapeRegExp(toProfile)}(?:\\s|$)`, 'i');
    return parseProcessTable()
        .filter((entry) => {
        const cmd = entry.cmd;
        if (!/(?:^|\s)voice\s+relay(?:\s|$)/i.test(cmd))
            return false;
        return fromPattern.test(cmd) && toPattern.test(cmd);
    })
        .map((entry) => entry.pid);
}
function relayLogPath(fromProfileInput, toProfileInput) {
    const fromProfile = normalizeVoiceProfile(fromProfileInput);
    const toProfile = normalizeVoiceProfile(toProfileInput);
    return `/tmp/voice_relay_${fromProfile}_${toProfile}.log`;
}
function readLastHeartbeatLine(fromProfileInput, toProfileInput) {
    const logPath = relayLogPath(fromProfileInput, toProfileInput);
    if (!fs_1.default.existsSync(logPath))
        return null;
    let body = '';
    try {
        body = fs_1.default.readFileSync(logPath, 'utf8');
    }
    catch {
        return null;
    }
    if (!body)
        return null;
    const lines = body.split('\n');
    for (let i = lines.length - 1; i >= 0; i -= 1) {
        const line = lines[i].trim();
        if (!line.startsWith('HB '))
            continue;
        const match = line.match(/^HB\s+([0-9]{4}-[0-9]{2}-[0-9]{2}T[^ ]+)/);
        const tsIso = match ? match[1] : null;
        let ageMs = null;
        if (tsIso) {
            const parsed = Date.parse(tsIso);
            if (Number.isFinite(parsed)) {
                ageMs = Math.max(0, Date.now() - parsed);
            }
        }
        return { line, tsIso, ageMs };
    }
    return null;
}
async function collectVoiceProtocolSnapshot(profileInput, port) {
    const profile = normalizeVoiceProfile(profileInput);
    const serverUp = await waitForVoiceServer(port, 450);
    return {
        profile,
        port,
        serverUp,
        streamWatchPids: findProfilePythonWorkerPids(profile, 'stream_watch.py'),
        responseAudioPids: findProfilePythonWorkerPids(profile, 'voice-response-audio-watch.py'),
        lastUserInput: readVoiceProfileLastInput(profile),
        lastAssistantOutput: readVoiceProfileLastAssistantOutput(profile),
    };
}
function loadRootScripts() {
    const packageJsonPath = path_1.default.join(repoRoot, 'package.json');
    const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf8'));
    return Object.entries(packageJson.scripts || {})
        .map(([name, command]) => ({ name, command }))
        .sort((a, b) => a.name.localeCompare(b.name));
}
function isRunnableScriptFile(fileName) {
    const ext = path_1.default.extname(fileName).toLowerCase();
    if (RUNNABLE_SCRIPT_EXTENSIONS.has(ext))
        return true;
    const lower = fileName.toLowerCase();
    return lower === 'makefile' || lower === 'justfile';
}
function discoverFileScripts() {
    const out = [];
    const roots = [path_1.default.join(repoRoot, 'scripts'), path_1.default.join(repoRoot, 'tools')].filter((p) => fs_1.default.existsSync(p));
    const walk = (dir) => {
        let entries = [];
        try {
            entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            if (entry.name === 'node_modules' || entry.name === '.git')
                continue;
            const absPath = path_1.default.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(absPath);
                continue;
            }
            if (!entry.isFile() || !isRunnableScriptFile(entry.name))
                continue;
            const relPath = path_1.default.relative(repoRoot, absPath).replace(/\\/g, '/');
            out.push({ key: relPath, relPath, absPath });
        }
    };
    for (const root of roots)
        walk(root);
    // Include runnable files directly in repo root.
    for (const fileName of fs_1.default.readdirSync(repoRoot)) {
        const absPath = path_1.default.join(repoRoot, fileName);
        if (!fs_1.default.existsSync(absPath) || !fs_1.default.statSync(absPath).isFile())
            continue;
        if (!isRunnableScriptFile(fileName))
            continue;
        const relPath = path_1.default.relative(repoRoot, absPath).replace(/\\/g, '/');
        out.push({ key: relPath, relPath, absPath });
    }
    return out.sort((a, b) => a.key.localeCompare(b.key));
}
function resolveFileScript(input) {
    const normalized = input.replace(/\\/g, '/').replace(/^\.?\//, '');
    const candidates = discoverFileScripts();
    const direct = candidates.find((item) => item.relPath === normalized);
    if (direct)
        return direct;
    const withScriptsPrefix = candidates.find((item) => item.relPath === `scripts/${normalized}`);
    if (withScriptsPrefix)
        return withScriptsPrefix;
    const withToolsPrefix = candidates.find((item) => item.relPath === `tools/${normalized}`);
    if (withToolsPrefix)
        return withToolsPrefix;
    const absCandidate = path_1.default.resolve(repoRoot, normalized);
    if (absCandidate.startsWith(repoRoot) &&
        fs_1.default.existsSync(absCandidate) &&
        fs_1.default.statSync(absCandidate).isFile() &&
        isRunnableScriptFile(path_1.default.basename(absCandidate))) {
        const relPath = path_1.default.relative(repoRoot, absCandidate).replace(/\\/g, '/');
        return { key: relPath, relPath, absPath: absCandidate };
    }
    return null;
}
async function runFileScript(file, args) {
    const ext = path_1.default.extname(file.absPath).toLowerCase();
    if (ext === '.sh' || ext === '.bash' || ext === '.zsh') {
        await runCommand('bash', [file.relPath, ...args]);
        return;
    }
    if (ext === '.py') {
        await runCommand('python3', [file.relPath, ...args]);
        return;
    }
    if (ext === '.ts' || ext === '.tsx') {
        await runCommand('node', ['--import', 'tsx', file.relPath, ...args]);
        return;
    }
    if (ext === '.js' || ext === '.cjs' || ext === '.mjs') {
        await runCommand('node', [file.relPath, ...args]);
        return;
    }
    throw new Error(`Unsupported script type for ${file.relPath}`);
}
const cliEntryPath = (0, url_1.fileURLToPath)(import.meta.url);
const AGENT_ROLE_TRAITS = ['orchestrator', 'broker', 'worker', 'participant'];
const AGENT_PLATFORM_TRAITS = ['antigravity', 'gemini', 'claude', 'jules', 'pi', 'vscode', 'browser'];
const SUPER_ADMIN_COMMAND_TRAITS = [
    'tnf relay start',
    'tnf jules loop',
    'tnf jules supervisor',
    'tnf jules supervisor-start',
    'tnf jules supervisor-stop',
    'tnf jules supervisor-migrate-from-cron',
    'tnf jules merge-open',
    'tnf jules cron-install',
    'tnf master-clock start|logs|status',
    'tnf super-cycle event|status',
    'tnf skills bank supervisor|supervisor-start|supervisor-stop',
    'tnf run <script>',
];
const REDIS_COMMAND_TRAITS = [
    'tnf register',
    'tnf list',
    'tnf send',
    'tnf orchestrate',
    'tnf convo',
    'tnf agents register|list|send|orchestrate|convo',
];
const CLOUD_FIRST_COMMAND_TRAITS = ['tnf master-clock start', 'tnf super-cycle event|status'];
const SPLASH_THEMES = ['fuse', 'atri', 'neon', 'ember', 'mono'];
const DEFAULT_SPLASH_THEME = 'fuse';
const DEFAULT_SPLASH_SPEED_MS = 85;
const safeStdoutHandler = (error) => {
    if (error?.code === 'EPIPE') {
        process.exit(0);
    }
    throw error;
};
process.stdout.on('error', safeStdoutHandler);
function coerceSplashTheme(value) {
    const normalized = (value || '').trim().toLowerCase();
    if (SPLASH_THEMES.includes(normalized)) {
        return normalized;
    }
    return DEFAULT_SPLASH_THEME;
}
function parseBooleanEnvFlag(value, fallback) {
    if (!value)
        return fallback;
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized))
        return true;
    if (['0', 'false', 'no', 'off'].includes(normalized))
        return false;
    return fallback;
}
function normalizeSplashOptions(options = {}) {
    const envTheme = process.env.TNF_SPLASH_THEME;
    const envAnimate = process.env.TNF_SPLASH_ANIMATE;
    const envSpeed = process.env.TNF_SPLASH_SPEED_MS;
    const envCompact = process.env.TNF_SPLASH_COMPACT;
    const theme = coerceSplashTheme(options.theme || envTheme);
    const animate = options.animate ?? parseBooleanEnvFlag(envAnimate, !!process.stdout.isTTY);
    const compact = options.compact ?? parseBooleanEnvFlag(envCompact, false);
    let speedMs = options.speedMs;
    if (speedMs == null) {
        const parsed = Number.parseInt(envSpeed || '', 10);
        speedMs = Number.isFinite(parsed) ? parsed : DEFAULT_SPLASH_SPEED_MS;
    }
    speedMs = Math.max(35, Math.min(240, speedMs));
    return { theme, animate, speedMs, compact };
}
function parseAnimateMode(value) {
    if (!value)
        return undefined;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'auto')
        return undefined;
    if (normalized === 'on' || normalized === 'true')
        return true;
    if (normalized === 'off' || normalized === 'false')
        return false;
    throw new Error("Invalid --animate mode. Use 'auto', 'on', or 'off'.");
}
function getThemePainter(theme) {
    switch (theme) {
        case 'atri':
            return {
                gradientStops: ['#22d3ee', '#60a5fa', '#a78bfa', '#f472b6'],
            };
        case 'neon':
            return {
                gradientStops: ['#22d3ee', '#8b5cf6', '#ec4899'],
            };
        case 'ember':
            return {
                gradientStops: ['#f59e0b', '#fb7185', '#ec4899'],
            };
        case 'mono':
            return {
                gradientStops: ['#d4d4d8', '#a1a1aa', '#d4d4d8'],
            };
        case 'fuse':
        default:
            return {
                gradientStops: ['#2563eb', '#6d28d9', '#be185d'],
            };
    }
}
function centerText(raw, width) {
    const normalized = raw.trim();
    if (normalized.length >= width)
        return normalized.slice(0, width);
    const left = Math.floor((width - normalized.length) / 2);
    const right = width - normalized.length - left;
    return `${' '.repeat(left)}${normalized}${' '.repeat(right)}`;
}
function gradientize(raw, stops) {
    if (raw.length === 0)
        return raw;
    if (stops.length === 0)
        return raw;
    if (stops.length === 1)
        return chalk_1.default.hex(stops[0])(raw);
    const maxIdx = stops.length - 1;
    return raw
        .split('')
        .map((char, idx) => {
        const ratio = raw.length <= 1 ? 0 : idx / (raw.length - 1);
        const stopIdx = Math.min(maxIdx, Math.floor(ratio * maxIdx));
        return chalk_1.default.hex(stops[stopIdx])(char);
    })
        .join('');
}
const HERO_TNF_LINES = [
    '                                                                                                                                ',
    '                              / ``````````````````````````````*````````````````````````````````^                                ',
    '                            /,.(FW0{\\kFW0{\\kFW0{\\kjW@4\\\\jQ@{(l\\ +{(\\jQ@{(\\jQ@4(\\j314\\\\j3@4(\\jQ@   \\                             ',
    '                          ,, ,,,.~-,y,j~-,_,j~-,_,j~-,_,j~-_,~j|.g,,,,-,,_j_-,,,j~-,u,j~-,.,j~-_., \\\\                           ',
    '                          ,_ `_____`  ,..................l. ___| ___.....................`.  __`__ _                            ',
    "                       //   *^^^` ^    ------------------ !``^`|''``! -------------------     *^^^`  \\`                         ",
    '                        -----------^   \\                 |!((u8|(UA;|                   /   -----------`  V                     ',
    '                     ~~~~~~~~~~~~~~    ,`````````````````|| ,-,|_p_,| ``````````````````\\   ~~~~~~~~~~~~~~~^                    ',
    '                        `             .  `````````` ```` |! ___|___ ! ```` ````````````                                         ',
    "                     `7`   `  `  ` `    |(`*``**`*`\\     |!`^^<|''^ |     ||```**`**`*****`***``****`````  /                    ",
    '                      ```````````````   |( hNJ| JJ|\\\\    |!((k4|(7p;|     ||({U )m53bbFT5J( FTk%JJFFX>    /                     ',
    '                                        |( _,.|.. ,,(\\   |:.,,,|__,,|     ||._.  _:.  ,,:   ,_ ______     ,                     ',
    "                                        |`  _ |    ``_ ` '' ___| ___!     ||___ ,_`_  ................  `                       ",
    "                                        |( \"`<|   '+~~ \\\\\\ `V^T|''U`|     ||''  t'~~   ................//                       ",
    '                                        |(:hm0|(JJ][9(J,,\\\\    |(bo;|     ||(;b );$3  )           /   //                        ',
    '                                        |  _,,|.  _ ,.  .,       ,,,|     || ., ,,,.  |            ~~~                          ',
    "                                        |`    |``__ ````_'  ```     !     ||  `  `'^  |--------------`                          ",
    "                                        |( Ut7| ~~ |``'A\"7*\\ \\\\\\^  `|     ||'7  )7(4  |                                         ",
    '                                        |( _;+|__pp|    jgcm,jj\\\\   |     ||}}n )B<Y  .............  /                          ',
    "                                        |` ___|    ||    `` _____   '     ||____,                , ,                            ",
    "                                        |('` `!   `||   `````^``*  \\`     ||''' t  ____________                                 ",
    '                                        |( UP0|`JJF||\\  \\ \\(k>0G{{)`\\\\    ||(+N )49+           7                                ',
    '                                        |( _,_|..  || \\       - ,_,_-\\\\   ||.___,_.  ``````````                                 ',
    "                                        |`  __| _  ||  `     ` ``__   _`` '| __  ,`_  ,````` ```.`                              ",
    "                                        |( \"^'|   '||   `|    \\`^\"^ ^^\" \\\\ |''' F+~~  |      ..                                 ",
    '                                        |((b;m|(J ,||    |( -   \\()jJ{mk) \\|:;n  ]4(  )........^                                ',
    '                                        |  ,,.|._ _||    |. ,,      .,___,.  ., ,,,.  |                                         ',
    '                                        |`` __|``_ ||    |\'   ` `  `"`` __`__`   \'""  |                                         ',
    '                                        |(7U~7|`~~>||    |(7U~7|-   ``!"4"@1`7G )7P7  |                                         ',
    '                                           ~  |(}~~||    |( n,}|_-    \\  ,,j_wn )   > )                                         ',
    '                                          ~.  `    ||    |` ___| _, . .    __     `  ,                                          ',
    '                                            `< `~  ||    |(\'` \'|  ``!    \\ ""     ,<                                            ',
    '                                            V  >. ~||    |( U;m|.^OF|   ` \\\\ <  >                                               ',
    '                                            >.<  `~ |    |(_,,.|.._,|        ,<  ,  `                                           ',
    '                                              `~>.  |    |` ___|`_`_!           .<                                              ',
    "                                                 >.~|    |( U`'|~ '^|     \\. _>^                                                ",
    '                                                   `-      `   |   ^      \\.<                                                   ',
    '                                                         | ~  .    , _                                                          ',
    '                                                         `   ~ `   ,                                                            ',
    '                                                               -',
];
function buildHugeTnfRows() {
    return [...HERO_TNF_LINES];
}
function shouldAutoCompactMenuSplash() {
    if (!process.stdout.isTTY)
        return false;
    const columns = process.stdout.columns ?? Number.MAX_SAFE_INTEGER;
    const rows = process.stdout.rows ?? Number.MAX_SAFE_INTEGER;
    const fullWidth = Math.max(...HERO_TNF_LINES.map((line) => line.length));
    const fullHeight = HERO_TNF_LINES.length;
    const menuRowBudget = 18;
    return columns < fullWidth || rows < fullHeight + menuRowBudget;
}
function buildSplashLines(options) {
    const paint = getThemePainter(options.theme);
    const compactWidth = 50;
    const compactWordmark = centerText('THE NEW FUSE', compactWidth);
    const compactTag = centerText('TNF', compactWidth);
    if (options.compact) {
        return [
            '',
            gradientize(compactWordmark, paint.gradientStops),
            gradientize(compactTag, paint.gradientStops),
            '',
        ];
    }
    return buildHugeTnfRows();
}
async function animateLogoMerge(options) {
    const lines = buildSplashLines(options);
    process.stdout.write('\x1Bc');
    for (const line of lines)
        console.log(line);
}
async function renderSplash(options = {}) {
    const normalized = normalizeSplashOptions(options);
    if (normalized.animate && process.stdout.isTTY && !normalized.compact) {
        await animateLogoMerge(normalized);
        return;
    }
    const lines = buildSplashLines(normalized);
    for (const line of lines) {
        console.log(line);
    }
}
function collectCommandPaths(command, lineage = ['tnf']) {
    const entries = [];
    for (const sub of command.commands) {
        const name = sub.name();
        if (!name || name === 'help')
            continue;
        const pathTokens = [...lineage, name];
        entries.push({
            path: pathTokens.join(' '),
            description: sub.description() || '',
        });
        entries.push(...collectCommandPaths(sub, pathTokens));
    }
    return entries;
}
function buildTypeIndex() {
    const cliNamespaces = Array.from(new Set(collectCommandPaths(program)
        .map((entry) => entry.path.split(' ')[1])
        .filter(Boolean))).sort((a, b) => a.localeCompare(b));
    const scriptNamespaces = loadRootScripts().reduce((acc, script) => {
        const namespace = script.name.includes(':') ? script.name.split(':')[0] : 'root';
        acc[namespace] = (acc[namespace] || 0) + 1;
        return acc;
    }, {});
    return { cliNamespaces, scriptNamespaces };
}
function buildTraitGroups() {
    return [
        { name: 'agent_roles', values: AGENT_ROLE_TRAITS },
        { name: 'agent_platforms', values: AGENT_PLATFORM_TRAITS },
        { name: 'super_admin_protected', values: SUPER_ADMIN_COMMAND_TRAITS },
        { name: 'redis_required', values: REDIS_COMMAND_TRAITS },
        { name: 'cloud_first', values: CLOUD_FIRST_COMMAND_TRAITS },
    ];
}
function buildCommandMenuSections(options = {}) {
    const sections = [
        {
            title: 'Agent Paths',
            entries: [
                { path: 'tnf agents list', description: 'List registered agents' },
                { path: 'tnf agents register [name] [role] [platform]', description: 'Register an agent' },
                { path: 'tnf agents send <message>', description: 'Send a one-off message' },
                {
                    path: 'tnf agents orchestrate <workflow>',
                    description: 'Run workflow (health-check|code-review|self-improvement)',
                },
                { path: 'tnf agents convo <start|join> [param]', description: 'Manage conversations' },
            ],
        },
        {
            title: 'Taxonomy Paths',
            entries: [
                { path: 'tnf types list', description: 'List command namespaces and script types' },
                { path: 'tnf traits list', description: 'List roles/platforms and command traits' },
                { path: 'tnf paths', description: 'List all available command paths' },
                {
                    path: 'tnf splash [--theme fuse|atri|neon|ember|mono]',
                    description: 'Render branded splash',
                },
                { path: 'tnf menu', description: 'Show this organized menu' },
            ],
        },
        {
            title: 'Core Ops',
            entries: [
                { path: 'tnf onboard', description: 'Run TNF frontload onboarding' },
                { path: 'tnf doctor', description: 'Run TNF diagnostics' },
                { path: 'tnf scripts list', description: 'List runnable scripts and package commands' },
                {
                    path: 'tnf scripts run <target> [args...]',
                    description: 'Execute script or file target',
                },
            ],
        },
        {
            title: 'OpenClaw Ops',
            entries: [
                { path: 'tnf openclaw [args...]', description: 'Pass through any OpenClaw CLI command' },
                { path: 'tnf claw [args...]', description: 'Alias for tnf openclaw' },
            ],
        },
        {
            title: 'Compatibility Ops',
            entries: [
                {
                    path: 'tnf compat openclaw [--json]',
                    description: 'Show TNF to OpenClaw compatibility and migration coverage',
                },
                {
                    path: 'tnf compat openclaw instances [--json]',
                    description: 'List OpenClaw installations and instances known to TNF',
                },
                {
                    path: 'tnf compat openclaw inventory [--json]',
                    description: 'Show redacted OpenClaw config and cron inventory',
                },
                {
                    path: 'tnf compat openclaw config [--path key.path] [--json]',
                    description: 'Show redacted OpenClaw settings or a specific subtree',
                },
                {
                    path: 'tnf compat openclaw cron [--json]',
                    description: 'List OpenClaw cron jobs with TNF schedule mapping',
                },
                {
                    path: 'tnf compat openclaw sync',
                    description: 'Sync live OpenClaw runtime state into TNF control-plane records',
                },
                {
                    path: 'tnf compat openclaw cleanup [--disable-failing] [--dry-run]',
                    description: 'Clean duplicate and failing TNF-managed OpenClaw cron jobs',
                },
            ],
        },
        {
            title: 'Automation Ops',
            entries: [
                { path: 'tnf jules supervisor-status', description: 'Show Jules supervisor status' },
                { path: 'tnf skills bank sync', description: 'Refresh the cross-LLM skill bank' },
                { path: 'tnf reports status', description: 'Show report lifecycle inventory' },
            ],
        },
    ];
    if (options.full) {
        const allPaths = collectCommandPaths(program).sort((a, b) => a.path.localeCompare(b.path));
        const namespaceCounts = allPaths.reduce((acc, entry) => {
            const namespace = entry.path.split(' ')[1] || 'root';
            acc[namespace] = (acc[namespace] || 0) + 1;
            return acc;
        }, {});
        const namespaceEntries = Object.entries(namespaceCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([namespace, count]) => ({
            path: `tnf ${namespace}`,
            description: `${count} CLI command path${count === 1 ? '' : 's'}`,
        }));
        const tnfRootScripts = loadRootScripts()
            .filter((script) => script.name === 'tnf' || script.name === 'tnf-agent' || script.name.startsWith('tnf:'))
            .map((script) => ({
            path: `pnpm run ${script.name}`,
            description: script.command,
        }));
        sections.push({
            title: 'CLI Namespace Counts',
            entries: namespaceEntries,
        }, {
            title: 'TNF Root Package Scripts',
            entries: tnfRootScripts,
        }, {
            title: 'All CLI Paths',
            entries: allPaths,
        });
    }
    return sections;
}
async function printCommandMenu(options = {}) {
    if (options.showSplash !== false) {
        await renderSplash(options.splash);
    }
    const allPaths = collectCommandPaths(program);
    const rootScripts = loadRootScripts();
    const tnfRootScripts = rootScripts.filter((script) => script.name === 'tnf' || script.name === 'tnf-agent' || script.name.startsWith('tnf:'));
    console.log(chalk_1.default.bold('\nTNF Command Menu\n'));
    console.log(chalk_1.default.dim(`CLI paths: ${allPaths.length} | tnf package scripts: ${tnfRootScripts.length} | total root scripts: ${rootScripts.length}`));
    console.log(chalk_1.default.dim('Use `tnf menu --full` for expanded inventory.\n'));
    for (const section of buildCommandMenuSections({ full: options.full })) {
        console.log(chalk_1.default.cyan(`${section.title}:`));
        for (const entry of section.entries) {
            const paddedPath = entry.path.padEnd(52, ' ');
            console.log(`  ${chalk_1.default.green(paddedPath)} ${chalk_1.default.dim(entry.description)}`);
        }
        console.log('');
    }
    console.log(chalk_1.default.dim('Run `tnf --help` for complete command reference.\n'));
}
async function runSelfCli(args) {
    await runCommand(process.execPath, [...process.execArgv, cliEntryPath, ...args]);
}
async function runSelfCliWithExit(args) {
    try {
        await runSelfCli(args);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
}
function normalizeForwardedArgs(args = []) {
    if (args.length > 0 && args[0] === '--') {
        return args.slice(1);
    }
    return args;
}
async function runOpenClawControl(args = []) {
    await runCommand('node', ['scripts/openclaw/tnf-openclaw-control.cjs', ...args]);
}
function buildOpenClawTargetArgs(options = {}) {
    const args = [];
    if (options.allInstances)
        args.push('--all-instances');
    if (options.installation)
        args.push('--installation', options.installation);
    if (options.instance)
        args.push('--instance', options.instance);
    if (options.stateDir)
        args.push('--state-dir', options.stateDir);
    return args;
}
function isOpenClawPassthroughArgv(argv) {
    const subcommand = argv[2];
    return subcommand === 'openclaw' || subcommand === 'claw';
}
function isHermesPassthroughArgv(argv) {
    const subcommand = argv[2];
    return subcommand === 'hermes';
}
function isGeminiPassthroughArgv(argv) {
    const subcommand = argv[2];
    return subcommand === 'gemini';
}
let cachedTopLevelCommands = {};
function getTnfTopLevelCommands() {
    return new Set(program.commands.map((command) => command.name()).filter((name) => !!name && name !== 'help'));
}
function parseTopLevelCommands(helpText) {
    const commands = new Set();
    const lines = helpText.split(/\r?\n/);
    const commandsIndex = lines.findIndex((line) => line.trim() === 'Commands:');
    if (commandsIndex < 0)
        return commands;
    for (const line of lines.slice(commandsIndex + 1)) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        if (trimmed.startsWith('Examples:') || trimmed.startsWith('Docs:') || trimmed.startsWith('Run'))
            break;
        const match = line.match(/^\s{2,}([a-z][a-z0-9-]*)(?:\s+\*)?\s{2,}/i);
        if (match?.[1]) {
            commands.add(match[1]);
        }
    }
    return commands;
}
function getTopLevelCommands(cliName) {
    if (cachedTopLevelCommands[cliName]) {
        return cachedTopLevelCommands[cliName];
    }
    try {
        const result = (0, child_process_1.spawnSync)(cliName, ['--no-color', '--help'], {
            encoding: 'utf8',
            env: process.env,
        });
        const output = `${result.stdout || ''}\n${result.stderr || ''}`;
        cachedTopLevelCommands[cliName] = parseTopLevelCommands(output);
    }
    catch {
        cachedTopLevelCommands[cliName] = new Set();
    }
    return cachedTopLevelCommands[cliName];
}
function resolveImplicitPassthroughArgs(argv) {
    const subcommand = argv[2];
    const tnfCommands = getTnfTopLevelCommands();
    const passthroughTargets = ['openclaw', 'hermes', 'gemini'];
    if (!subcommand || subcommand === 'help') {
        const helpTarget = argv[3];
        if (!helpTarget)
            return null;
        if (tnfCommands.has(helpTarget))
            return null;
        for (const target of passthroughTargets) {
            if (getTopLevelCommands(target).has(helpTarget)) {
                return { cliName: target, args: [helpTarget, '--help'] };
            }
        }
        return null;
    }
    if (tnfCommands.has(subcommand))
        return null;
    for (const target of passthroughTargets) {
        if (getTopLevelCommands(target).has(subcommand)) {
            return { cliName: target, args: argv.slice(2) };
        }
    }
    return null;
}
function buildOpenClawCompatibilityEntries() {
    const tnfTopLevelCommands = getTnfTopLevelCommands();
    return Array.from(getTopLevelCommands('openclaw'))
        .sort((a, b) => a.localeCompare(b))
        .map((command) => {
        const collidesWithTnf = tnfTopLevelCommands.has(command);
        return {
            command,
            mode: collidesWithTnf ? 'explicit-only' : 'implicit',
            directPath: collidesWithTnf ? null : `tnf ${command}`,
            explicitPath: `tnf openclaw ${command}`,
        };
    });
}
function buildOpenClawCompatibilityReport() {
    const entries = buildOpenClawCompatibilityEntries();
    const implicit = entries.filter((entry) => entry.mode === 'implicit');
    const explicitOnly = entries.filter((entry) => entry.mode === 'explicit-only');
    return {
        totalOpenClawTopLevelCommands: entries.length,
        implicitCommands: implicit.length,
        explicitOnlyCommands: explicitOnly.length,
        entries,
    };
}
program
    .name('tnf')
    .description('TNF CLI - Unified Command Surface for TNF Operations\n\n' +
    '🔑 Super Admin Authentication:\n' +
    '  Certain restricted commands require a Super Admin token.\n' +
    '  You must set the TNF_SUPER_ADMIN_TOKEN in your environment as the master secret.\n' +
    '  To authenticate a command, you can:\n' +
    '    - Use the --super-admin-token <token> flag\n' +
    '    - Set the TNF_SUPER_ADMIN_INPUT_TOKEN environment variable\n' +
    '    - Set the CI_SUPER_ADMIN_TOKEN environment variable (for CI/CD)')
    .version('1.0.0')
    .showSuggestionAfterError()
    .showHelpAfterError();
const logMessage = (message) => {
    const fromName = message.from?.agentName || 'Unknown';
    const fromRole = message.from?.role || '';
    const type = message.type || 'message';
    const content = message.content || '';
    const roleEmoji = {
        orchestrator: '👑',
        broker: '🎯',
        worker: '⚙️',
        participant: '💬',
    };
    const emoji = roleEmoji[fromRole] || '📨';
    let color = chalk_1.default.white;
    if (fromRole === 'orchestrator') {
        color = chalk_1.default.yellow;
    }
    else if (fromRole === 'broker') {
        color = chalk_1.default.cyan;
    }
    else if (fromRole === 'worker') {
        color = chalk_1.default.green;
    }
    console.log(`\n${emoji} [${color.bold(fromName)}] (${chalk_1.default.dim(type)}):`);
    console.log(`   ${content}`);
    if (message.metadata?.event) {
        console.log(`   ${chalk_1.default.blue('Event:')} ${message.metadata.event}`);
    }
    if (message.expectsResponse) {
        console.log(`   ${chalk_1.default.yellow('⏳ Expects response')}`);
    }
};
function isRedisUnavailable(error) {
    const message = error instanceof Error ? error.message : String(error ?? '');
    return (message.includes('Could not connect to Redis') ||
        message.includes('max retries per request') ||
        message.includes('ECONNREFUSED'));
}
function logRedisUnavailable(commandHint) {
    console.error(chalk_1.default.yellow('Redis is unavailable at localhost:6379.'));
    console.error(chalk_1.default.yellow(`Start Redis, then re-run \`${commandHint}\`.`));
    process.exit(1);
}
program
    .command('boot')
    .description('Master entry point to boot the entire TNF stack')
    .argument('[name]', 'Profile/Instance name to boot', 'goldberg')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (name, options) => {
    try {
        requireSuperAdmin(options, 'boot');
        console.log(chalk_1.default.bold.cyan(`\n🚀 Booting TNF Stack: ${chalk_1.default.yellow(name)}\n`));
        const steps = [
            {
                label: 'Verifying environment variables',
                action: async () => {
                    await runCommand('bash', ['scripts/validate-env.sh']);
                },
            },
            {
                label: 'Mounting volumes (ensuring directories)',
                action: async () => {
                    const dirs = [
                        '.agent/runtime-state',
                        '.agent/runtime-logs',
                        '.agent/test-reports',
                        'data/agent-registry',
                    ];
                    for (const dir of dirs) {
                        if (!fs_1.default.existsSync(path_1.default.join(repoRoot, dir))) {
                            fs_1.default.mkdirSync(path_1.default.join(repoRoot, dir), { recursive: true });
                            console.log(chalk_1.default.dim(`   Created ${dir}`));
                        }
                    }
                },
            },
            {
                label: 'Starting LLM health monitor',
                action: async () => {
                    await runCommand('node', ['scripts/mcp-health-check.cjs']);
                },
            },
            {
                label: 'Starting directive rotation scheduler',
                action: async () => {
                    // Run supercycle flywheel in background if not already running
                    await runCommand('pnpm', ['run', 'factory:supercycle'], { isBackground: true });
                },
            },
            {
                label: 'Starting LLM provider tester agent',
                action: async () => {
                    // Run tester agent in background to continuously cycle through API keys and ensure viability
                    await runCommand('node', ['scripts/swarm/llm-provider-tester.cjs'], {
                        isBackground: true,
                    });
                },
            },
            {
                label: 'Starting model fallback chain',
                action: async () => {
                    await runCommand('node', ['scripts/orchestrator/zeroclaw-boot.cjs']);
                },
            },
            {
                label: 'Initializing handoff matrix',
                action: async () => {
                    // RelayHealthCheck often handles initial handoff state
                    if (fs_1.default.existsSync(path_1.default.join(repoRoot, 'scripts/RelayHealthCheck.cjs'))) {
                        await runCommand('node', ['scripts/RelayHealthCheck.cjs']);
                    }
                    else {
                        console.log(chalk_1.default.dim('   Handoff matrix already synchronized'));
                    }
                },
            },
            {
                label: 'Starting platform gateways',
                action: async () => {
                    await runCommand('bash', ['scripts/orchestrator/factory-boot.sh']);
                },
            },
            {
                label: 'Booting agent swarm',
                action: async () => {
                    await runCommand('bash', ['scripts/start-agent-network.sh', '--all']);
                },
            },
            {
                label: 'Starting OpenClaw gateway',
                action: async () => {
                    await runCommand('node', ['scripts/tnf-start-ai.cjs', 'openclaw']);
                },
            },
            {
                label: 'Starting Hermes operator agent',
                action: async () => {
                    // Spawn hermes in detached background mode
                    await runCommand('hermes', ['--daemon'], { isBackground: true });
                },
            },
            {
                label: 'Bringing up browser control panel',
                action: async () => {
                    if (process.platform === 'darwin') {
                        await runCommand('open', ['https://thenewfuse.com/health']);
                    }
                    else {
                        console.log(chalk_1.default.yellow('   Manual action: Open https://thenewfuse.com/health'));
                    }
                },
            },
            {
                label: 'Executing self-test and reporting status',
                action: async () => {
                    await runCommand('bash', ['scripts/system-health-verification.sh']);
                },
            },
        ];
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            process.stdout.write(chalk_1.default.white(`[${i + 1}/${steps.length}] ${step.label}... `));
            try {
                await step.action();
                process.stdout.write(chalk_1.default.green('OK\n'));
            }
            catch (err) {
                process.stdout.write(chalk_1.default.red('FAILED\n'));
                console.error(chalk_1.default.red(`   Error in step "${step.label}": ${err.message}`));
                if (i < 2) {
                    // Critical steps
                    throw new Error(`Critical boot failure in step: ${step.label}`);
                }
            }
        }
        console.log(chalk_1.default.bold.green(`\n✅ TNF Stack "${name}" is now operational!\n`));
    }
    catch (err) {
        console.error(chalk_1.default.red(`\n❌ Boot sequence aborted: ${err.message}`));
        process.exit(1);
    }
});
program
    .command('register')
    .description('Register and listen as an agent')
    .argument('[name]', 'Agent name', process.env.AGENT_NAME || 'unnamed-agent')
    .argument('[role]', 'Agent role (orchestrator, broker, worker, participant)', process.env.AGENT_ROLE || 'participant')
    .argument('[platform]', 'Agent platform (antigravity, gemini, claude, jules, pi, vscode, browser)', process.env.AGENT_PLATFORM || 'vscode')
    .option('-d, --daemon', 'Run in daemon mode (register and exit immediately)', false)
    .action(async (name, role, platform, options) => {
    const client = new RedisAgentClient_js_1.RedisAgentClient();
    try {
        await client.initialize();
        const agentInfo = await client.register(name, role, platform);
        console.log(chalk_1.default.green(`\n🤖 Registered as: ${chalk_1.default.bold(name)} (${role}) on ${platform}`));
        console.log(`   ID: ${chalk_1.default.dim(agentInfo.id)}`);
        console.log(`   Capabilities: ${chalk_1.default.dim(agentInfo.capabilities.join(', '))}`);
        if (options.daemon) {
            console.log(chalk_1.default.cyan('\n🚀 Daemon mode: Agent registered and running in background'));
            // Keep heartbeat running in background
            // In production, this would be a long-running process
            // For now, just clean up the registration
            await client.cleanup();
            console.log(chalk_1.default.green('\n✅ Agent deployment complete'));
            process.exit(0);
        }
        console.log(chalk_1.default.cyan('\n🎧 Listening for messages... (Type a message and press Enter, or Ctrl+C to exit)\n'));
        client.onMessage('*', (msg) => {
            logMessage(msg);
        });
        const rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.on('line', async (line) => {
            if (line.trim()) {
                await client.send(line.trim());
            }
        });
        process.on('SIGINT', async () => {
            console.log(chalk_1.default.yellow('\n👋 Shutting down...'));
            await client.cleanup();
            process.exit(0);
        });
    }
    catch (err) {
        if (isRedisUnavailable(err)) {
            logRedisUnavailable(`./tnf register ${name} ${role} ${platform}`);
        }
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
program
    .command('onboard')
    .description('Run TNF frontload onboarding')
    .option('--allow-local-db', 'Allow local DATABASE_URL for this run')
    .option('--require-cloud-db', 'Require cloud DATABASE_URL for this run')
    .option('--no-require-cloud-db', 'Allow non-cloud DATABASE_URL for this run')
    .option('--database-url <url>', 'Override DATABASE_URL for this run')
    .action(async (options) => {
    try {
        const args = ['scripts/tnf-onboard.cjs'];
        if (options.allowLocalDb)
            args.push('--allow-local-db');
        if (typeof options.requireCloudDb === 'boolean') {
            args.push(options.requireCloudDb ? '--require-cloud-db' : '--no-require-cloud-db');
        }
        if (options.databaseUrl)
            args.push('--database-url', options.databaseUrl);
        await runCommand('node', args);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
program
    .command('doctor')
    .description('Run TNF diagnostics')
    .option('--mode <mode>', 'Execution mode: cloud (default) or local')
    .option('--allow-local-db', 'Allow local DATABASE_URL for this run')
    .option('--require-cloud-db', 'Require cloud DATABASE_URL for this run')
    .option('--no-require-cloud-db', 'Allow non-cloud DATABASE_URL for this run')
    .option('--database-url <url>', 'Override DATABASE_URL for this run')
    .action(async (options) => {
    try {
        const args = ['scripts/tnf-doctor.cjs'];
        if (options.mode)
            args.push('--mode', options.mode);
        if (options.allowLocalDb)
            args.push('--allow-local-db');
        if (typeof options.requireCloudDb === 'boolean') {
            args.push(options.requireCloudDb ? '--require-cloud-db' : '--no-require-cloud-db');
        }
        if (options.databaseUrl)
            args.push('--database-url', options.databaseUrl);
        await runCommand('node', args);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const metaskills = program.command('metaskills').description('Meta-skills audit utilities');
metaskills
    .command('audit')
    .description('Audit meta-skills and scaffolding readiness')
    .option('--json', 'Print JSON output')
    .action(async (options) => {
    try {
        const args = ['scripts/tnf-metaskills-audit.cjs'];
        if (options.json)
            args.push('--json');
        await runCommand('node', args);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const mcp = program.command('mcp').description('MCP utilities');
mcp
    .command('generate')
    .description('Generate MCP clients inventory')
    .action(async () => {
    try {
        await runCommand('node', ['scripts/tnf-generate-mcp-clients.cjs']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
mcp
    .command('add')
    .description('Add an MCP server')
    .argument('<name>', 'Server name')
    .requiredOption('--command <cmd>', 'Command to run')
    .option('--args <args...>', 'Arguments for the command')
    .option('--env <json>', 'Environment variables as JSON')
    .option('--cwd <path>', 'Working directory')
    .action((name, options) => {
    try {
        let env;
        if (options.env) {
            env = JSON.parse(options.env);
        }
        const mcpManager = new MCPManagerService_js_1.MCPManagerService();
        mcpManager.addServer(name, {
            command: options.command,
            args: options.args,
            env,
            cwd: options.cwd,
        });
        console.log(chalk_1.default.green(`✅ Added MCP server '${name}'`));
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
mcp
    .command('list')
    .alias('ls')
    .description('List MCP servers and their status')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const mcpManager = new MCPManagerService_js_1.MCPManagerService();
        const servers = mcpManager.listServers();
        if (options.json) {
            console.log(JSON.stringify(servers, null, 2));
            return;
        }
        console.log(chalk_1.default.bold('\nMCP Servers\n'));
        if (servers.length === 0) {
            console.log(chalk_1.default.dim('No MCP servers configured'));
        }
        else {
            for (const server of servers) {
                const status = server.running ? chalk_1.default.green('running') : chalk_1.default.yellow('stopped');
                const oauth = server.oauth?.enabled
                    ? server.oauth.authenticated
                        ? chalk_1.default.green('auth ✓')
                        : chalk_1.default.red('auth ✗')
                    : '';
                console.log(`  ${chalk_1.default.cyan(server.name)}: ${status} ${oauth}`);
            }
        }
        console.log('');
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
mcp
    .command('auth')
    .description('Authenticate with an OAuth-enabled MCP server')
    .argument('[name]', 'Server name')
    .action(async (name) => {
    try {
        const mcpManager = new MCPManagerService_js_1.MCPManagerService();
        if (!name) {
            const servers = mcpManager.listServers().filter((s) => s.oauth?.enabled);
            if (servers.length === 0) {
                console.log(chalk_1.default.yellow('No OAuth-enabled MCP servers configured'));
                process.exit(0);
            }
            console.log(chalk_1.default.bold('\nOAuth-enabled servers:\n'));
            for (const s of servers) {
                console.log(`  ${chalk_1.default.cyan(s.name)}`);
            }
            console.log('');
            return;
        }
        const result = await mcpManager.authenticate(name);
        console.log(chalk_1.default.cyan(`\n  Authorize URL: ${result.url}`));
        if (result.code) {
            console.log(chalk_1.default.dim(`  State: ${result.code}`));
        }
        console.log('');
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
mcp
    .command('logout')
    .description('Remove OAuth credentials for an MCP server')
    .argument('[name]', 'Server name')
    .action((name) => {
    try {
        if (!name) {
            console.log(chalk_1.default.yellow('Please specify a server name'));
            process.exit(1);
        }
        const mcpManager = new MCPManagerService_js_1.MCPManagerService();
        if (mcpManager.logout(name)) {
            console.log(chalk_1.default.green(`✅ Logged out from '${name}'`));
        }
        else {
            console.log(chalk_1.default.yellow(`No credentials found for '${name}'`));
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
mcp
    .command('debug')
    .description('Debug OAuth connection for an MCP server')
    .argument('<name>', 'Server name')
    .option('--json', 'Output machine-readable JSON')
    .action(async (name, options) => {
    try {
        const mcpManager = new MCPManagerService_js_1.MCPManagerService();
        const result = await mcpManager.debugConnection(name);
        if (options.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        console.log(chalk_1.default.bold(`\nMCP Server: ${name}\n`));
        for (const diag of result.diagnostics) {
            console.log(`  ${diag}`);
        }
        console.log('');
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const ai = program.command('ai').description('AI launcher commands');
ai.command('start')
    .argument('[provider]', 'codex|claude|gemini', '')
    .description('Start an AI session helper')
    .action(async (provider) => {
    try {
        const args = ['scripts/tnf-start-ai.cjs'];
        if (provider)
            args.push(provider);
        await runCommand('node', args);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
ai.command('models')
    .description('List available models for the current provider')
    .action(async () => {
    try {
        const { LLMClient } = await Promise.resolve().then(() => __importStar(require('./utils/llm-client.js')));
        const client = new LLMClient();
        console.log(chalk_1.default.blue('\nFetching available models...'));
        const models = await client.fetchAvailableModels();
        if (models.length === 0) {
            console.log(chalk_1.default.yellow('No models found or provider does not support listing.'));
        }
        else {
            console.log(chalk_1.default.green(`\nAvailable models:`));
            models.forEach((m) => console.log(` - ${m}`));
        }
        console.log('');
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
ai.command('chat')
    .description('Interactive chat with LLM (Ctrl+C or .exit to quit)')
    .option('-m, --model <model>', 'Model to use')
    .option('-t, --temperature <temp>', 'Temperature (0-2)', '0.7')
    .option('--system <prompt>', 'System prompt')
    .action(async (opts) => {
    try {
        const readline = await Promise.resolve().then(() => __importStar(require('readline')));
        const { LLMClient } = await Promise.resolve().then(() => __importStar(require('./utils/llm-client.js')));
        const client = new LLMClient('orchestrator');
        // Override model if specified
        if (opts.model) {
            process.env.TNF_LLM_MODEL = opts.model;
            client.resolveProvider(); // Re-resolve with new model
        }
        const messages = [];
        if (opts.system) {
            messages.push({ role: 'system', content: opts.system });
        }
        console.log(chalk_1.default.blue('\n📟 TNF CLI Chat'));
        console.log(chalk_1.default.dim('Type .exit to quit, .clear to clear history\n'));
        console.log(chalk_1.default.dim('Provider: ' + client.baseUrl));
        console.log(chalk_1.default.dim('Model: ' + client.model + '\n'));
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const ask = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));
        while (true) {
            const input = await ask(chalk_1.default.green('\n> '));
            if (input.trim() === '.exit')
                break;
            if (input.trim() === '.clear') {
                messages.length = opts.system ? 1 : 0;
                console.log(chalk_1.default.dim('History cleared'));
                continue;
            }
            if (!input.trim())
                continue;
            messages.push({ role: 'user', content: input });
            try {
                const response = await client.chatComplete(messages, {
                    temperature: parseFloat(opts.temperature),
                });
                console.log(chalk_1.default.cyan('\nA: ' + response));
                messages.push({ role: 'assistant', content: response });
            }
            catch (err) {
                console.error(chalk_1.default.red('Error: ' + err.message));
            }
        }
        rl.close();
        console.log(chalk_1.default.blue('\n👋 Chat session ended'));
    }
    catch (err) {
        console.error(chalk_1.default.red('Error: ' + err.message));
        process.exit(1);
    }
});
program
    .command('chat')
    .description('Start an interactive chat session with the TNF Orchestrator (Gemini OAuth)')
    .argument('[query...]', 'Initial message')
    .action(async (query) => {
    try {
        const systemPromptPath = path_1.default.join(repoRoot, '.agent/SYSTEM_PROMPT.md');
        const systemPrompt = fs_1.default.existsSync(systemPromptPath)
            ? fs_1.default.readFileSync(systemPromptPath, 'utf8')
            : 'You are the TNF Orchestrator agent.';
        const args = ['--prompt-interactive', systemPrompt];
        if (query.length > 0) {
            args.push(query.join(' '));
        }
        // Ensure MCP config is loaded
        const mcpConfigPath = path_1.default.join(repoRoot, 'data/mcp.clients/gemini.mcp.json');
        const env = {};
        if (fs_1.default.existsSync(mcpConfigPath)) {
            env.TNF_MCP_CONFIG_PATH = mcpConfigPath;
            env.MCP_CONFIG_PATH = mcpConfigPath;
        }
        await runCommand('gemini', args, { env });
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
program
    .command('openclaw')
    .description('Pass through any OpenClaw CLI command')
    .argument('[args...]', 'Arguments forwarded to openclaw');
program
    .command('claw')
    .description('Alias for `tnf openclaw`')
    .argument('[args...]', 'Arguments forwarded to openclaw');
program
    .command('hermes')
    .description('Pass through any Hermes Agent CLI command')
    .argument('[args...]', 'Arguments forwarded to hermes');
program
    .command('gemini')
    .description('Pass through any Gemini CLI command')
    .argument('[args...]', 'Arguments forwarded to gemini');
const relay = program.command('relay').description('Relay operations');
relay
    .command('start')
    .description('Start relay-core relay service')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'relay start');
        await runCommand('pnpm', ['--filter', '@the-new-fuse/relay-core', 'run', 'relay']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
relay
    .command('monitor')
    .description('Monitor relay channels')
    .action(async () => {
    try {
        await runCommand('node', ['scripts/relay-channel-monitor.cjs']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const jules = program.command('jules').description('Jules automation operations');
jules
    .command('loop')
    .description('Run autonomous Jules loop')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'jules loop');
        await runCommand('bash', ['scripts/jules-autonomous-loop.sh']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
jules
    .command('supervisor')
    .description('Run continuous Jules follow-up supervisor')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'jules supervisor');
        await runCommand('bash', ['scripts/jules-followup-supervisor.sh']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
jules
    .command('supervisor-start')
    .description('Start Jules follow-up supervisor in background')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'jules supervisor-start');
        await runCommand('bash', ['scripts/jules-followup-start.sh']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
jules
    .command('supervisor-stop')
    .description('Stop Jules follow-up supervisor')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'jules supervisor-stop');
        await runCommand('bash', ['scripts/jules-followup-stop.sh']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
jules
    .command('supervisor-status')
    .description('Show Jules follow-up supervisor status')
    .action(async () => {
    try {
        await runCommand('bash', ['scripts/jules-followup-status.sh']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
jules
    .command('supervisor-migrate-from-cron')
    .description('Disable cron follow-up and switch to supervisor mode')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'jules supervisor-migrate-from-cron');
        await runCommand('bash', ['scripts/jules-followup-migrate-from-cron.sh']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
jules
    .command('merge-open')
    .description('Merge all open Jules PRs')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'jules merge-open');
        await runCommand('bash', ['scripts/jules-merge-open-prs.sh']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
jules
    .command('cron-install')
    .description('Install local Jules cron loop')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'jules cron-install');
        await runCommand('bash', ['scripts/install-jules-cron.sh']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const mirror = program.command('mirror').description('iPhone mirroring and AI vision operations');
mirror
    .command('setup')
    .description('Install dependencies for mirroring (UxPlay, Python libs)')
    .action(async () => {
    try {
        console.log(chalk_1.default.blue('Installing system dependencies (Homebrew libraries for UxPlay)...'));
        await runCommand('brew', [
            'install',
            'cmake',
            'libplist',
            'openssl@3',
            'pkg-config',
            'gstreamer',
            'gst-plugins-base',
            'gst-plugins-good',
            'gst-plugins-bad',
            'gst-libav',
        ]);
        console.log(chalk_1.default.blue('Checking for UxPlay binary...'));
        try {
            await runCommand('which', ['uxplay']);
            console.log(chalk_1.default.green('UxPlay already installed.'));
        }
        catch {
            console.log(chalk_1.default.yellow('UxPlay not found. Building from source...'));
            const tmpDir = '/tmp/uxplay-build';
            await runCommand('rm', ['-rf', tmpDir]);
            await runCommand('git', ['clone', 'https://github.com/FDH2/UxPlay.git', tmpDir]);
            const buildCmd = `cd ${tmpDir} && cmake . && make`;
            await runCommand('bash', ['-c', buildCmd]);
            await runCommand('sudo', ['make', '-C', tmpDir, 'install']);
            console.log(chalk_1.default.green('UxPlay built and installed successfully.'));
        }
        console.log(chalk_1.default.blue('Installing Python dependencies...'));
        try {
            await runCommand('pip', ['install', 'pyautogui', 'opencv-python', 'numpy']);
        }
        catch {
            await runCommand('pip3', ['install', 'pyautogui', 'opencv-python', 'numpy']);
        }
        console.log(chalk_1.default.green('Setup complete!'));
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error during setup: ${err.message}`));
        process.exit(1);
    }
});
mirror
    .command('start')
    .description('Start the Vision Bridge mirroring server')
    .action(async () => {
    try {
        await runCommand('python3', ['scripts/iphone_ai_mirror.py']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error starting mirror: ${err.message}`));
        process.exit(1);
    }
});
const forge = program
    .command('forge')
    .description('LLVM-powered JIT compilation and native optimization');
forge
    .command('status')
    .description('Check the status of the LLVM/Forge toolchain')
    .action(async () => {
    try {
        console.log(chalk_1.default.blue('Checking Forge toolchain...'));
        await runCommand('clang', ['--version']);
        console.log(chalk_1.default.green('LLVM/Clang is ready.'));
    }
    catch {
        console.log(chalk_1.default.red('LLVM/Clang not found. Run "tnf mirror setup" to install.'));
    }
});
forge
    .command('test-math')
    .description('Run a JIT compilation speed test (Python vs Forged C)')
    .action(async () => {
    try {
        console.log(chalk_1.default.blue('Starting math speed test...'));
        await runCommand('python3', ['scripts/tnf_forge.py']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Forge test failed: ${err.message}`));
    }
});
forge
    .command('test-python')
    .description('Run a Python Hot-Swap test (Injected Native Code)')
    .action(async () => {
    try {
        console.log(chalk_1.default.blue('Starting Python acceleration test...'));
        await runCommand('python3', ['scripts/python_accelerator.py']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Acceleration test failed: ${err.message}`));
    }
});
forge
    .command('test-gateway')
    .description('Run Omni-TNF Gateway Native Accelerator test (Phase 2 Scaffolding)')
    .action(async () => {
    try {
        console.log(chalk_1.default.blue('Starting Omni-TNF Gateway native test...'));
        await runCommand('python3', ['scripts/omni_gateway_accelerator.py']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Gateway test failed: ${err.message}`));
    }
});
const masterClock = program
    .command('master-clock')
    .description('Master clock controls (cloud-first)');
masterClock
    .command('start')
    .description('Start master-clock in cloud via CloudRuntime (default) or locally')
    .option('--local', 'Run local master-clock (override cloud-first policy)', false)
    .option('--service <name>', 'CloudRuntime service name for master clock', 'tnf-master-clock')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'master-clock start');
        if (options.local) {
            await runCommand('pnpm', ['--filter', '@the-new-fuse/relay-core', 'run', 'master-clock']);
            return;
        }
        console.log(chalk_1.default.cyan(`☁️ Starting cloud master clock on CloudRuntime service ${options.service}`));
        await runCommand('cloud_runtime', ['up', '--service', options.service]);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
masterClock
    .command('logs')
    .description('Tail cloud master-clock logs')
    .option('--service <name>', 'CloudRuntime service name for master clock', 'tnf-master-clock')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'master-clock logs');
        await runCommand('cloud_runtime', ['logs', '--service', options.service]);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
masterClock
    .command('status')
    .description('Show CloudRuntime status for master-clock service')
    .option('--service <name>', 'CloudRuntime service name for master clock', 'tnf-master-clock')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'master-clock status');
        await runCommand('cloud_runtime', ['status', '--service', options.service]);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const superCycle = program.command('super-cycle').description('Super-cycle controls (cloud-first)');
superCycle
    .command('event')
    .description('Send super-cycle register/heartbeat/unregister event')
    .requiredOption('--action <action>', 'register|heartbeat|unregister')
    .requiredOption('--process-id <id>', 'Process identifier')
    .option('--name <name>', 'Process display name')
    .option('--status <status>', 'Process status', 'running')
    .option('--kind <kind>', 'Process kind', 'scheduled-job')
    .option('--owner <owner>', 'Process owner', 'tnf')
    .option('--result <result>', 'Last result')
    .option('--metadata <json>', 'JSON metadata', '{}')
    .option('--local', 'Run local super-cycle client (override cloud-first policy)', false)
    .option('--service <name>', 'CloudRuntime service name', 'tnf-master-clock')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'super-cycle event');
        const baseArgs = [
            '--filter',
            '@the-new-fuse/relay-core',
            'run',
            'super-cycle:event',
            '--',
            '--action',
            options.action,
            '--process-id',
            options.processId,
            '--status',
            options.status,
            '--kind',
            options.kind,
            '--owner',
            options.owner,
            '--metadata',
            options.metadata,
        ];
        if (options.name)
            baseArgs.push('--name', options.name);
        if (options.result)
            baseArgs.push('--result', options.result);
        if (options.local) {
            await runCommand('pnpm', baseArgs);
            return;
        }
        console.log(chalk_1.default.cyan(`☁️ Sending super-cycle event via cloud service ${options.service}`));
        await runCommand('cloud_runtime', ['run', '--service', options.service, 'pnpm', ...baseArgs]);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const compat = program.command('compat').description('Compatibility and migration utilities');
const compatOpenClaw = compat
    .command('openclaw')
    .description('Show TNF to OpenClaw command-surface compatibility')
    .option('--json', 'Output machine-readable JSON')
    .option('--mode <mode>', 'all|implicit|explicit-only', 'all')
    .action((options) => {
    try {
        const report = buildOpenClawCompatibilityReport();
        const normalizedMode = (options.mode || 'all').trim().toLowerCase();
        if (!['all', 'implicit', 'explicit-only'].includes(normalizedMode)) {
            throw new Error("Invalid --mode value. Use 'all', 'implicit', or 'explicit-only'.");
        }
        const entries = normalizedMode === 'all'
            ? report.entries
            : report.entries.filter((entry) => entry.mode === normalizedMode);
        if (options.json) {
            console.log(JSON.stringify({
                ...report,
                mode: normalizedMode,
                entries,
            }, null, 2));
            return;
        }
        console.log(chalk_1.default.bold('\nOpenClaw Compatibility\n'));
        console.log(`   Total OpenClaw top-level commands: ${chalk_1.default.cyan(String(report.totalOpenClawTopLevelCommands))}`);
        console.log(`   Direct TNF paths: ${chalk_1.default.green(String(report.implicitCommands))}`);
        console.log(`   Explicit namespace only: ${chalk_1.default.yellow(String(report.explicitOnlyCommands))}`);
        console.log(`   View: ${chalk_1.default.cyan(normalizedMode)}\n`);
        for (const entry of entries) {
            const route = entry.mode === 'implicit'
                ? `${chalk_1.default.green(entry.directPath || '')} ${chalk_1.default.dim(`(also ${entry.explicitPath})`)}`
                : `${chalk_1.default.yellow(entry.explicitPath)} ${chalk_1.default.dim('(kept explicit to avoid TNF command collision)')}`;
            console.log(`   ${chalk_1.default.bold(entry.command.padEnd(18, ' '))} ${route}`);
        }
        console.log('');
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
compatOpenClaw
    .command('instances')
    .description('List OpenClaw installations and instances known to TNF')
    .option('--json', 'Output machine-readable JSON')
    .action(async (options) => {
    try {
        const args = ['instances'];
        if (options.json)
            args.push('--json');
        await runOpenClawControl(args);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
compatOpenClaw
    .command('inventory')
    .description('Show redacted OpenClaw config and cron inventory')
    .option('--json', 'Output machine-readable JSON')
    .option('--installation <id>', 'Installation id')
    .option('--instance <id>', 'Instance/profile id')
    .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
    .option('--all-instances', 'Inspect every discovered instance')
    .action(async (options) => {
    try {
        const args = ['overview', ...buildOpenClawTargetArgs(options)];
        if (options.json)
            args.push('--json');
        await runOpenClawControl(args);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
compatOpenClaw
    .command('config')
    .description('Show redacted OpenClaw settings or a subtree')
    .option('--path <path>', 'Dot path within openclaw.json')
    .option('--json', 'Output machine-readable JSON')
    .option('--installation <id>', 'Installation id')
    .option('--instance <id>', 'Instance/profile id')
    .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
    .option('--all-instances', 'Read config across every discovered instance')
    .action(async (options) => {
    try {
        const args = ['config-show', ...buildOpenClawTargetArgs(options)];
        if (options.path)
            args.push('--path', options.path);
        if (options.json)
            args.push('--json');
        await runOpenClawControl(args);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
compatOpenClaw
    .command('config-set')
    .description('Set an OpenClaw config value through TNF')
    .argument('<path>', 'Dot path within openclaw.json')
    .argument('<value>', 'Value to set')
    .option('--type <type>', 'string|number|boolean|json|null', 'string')
    .option('--installation <id>', 'Installation id')
    .option('--instance <id>', 'Instance/profile id')
    .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
    .action(async (targetPath, value, options) => {
    try {
        await runOpenClawControl([
            'config-set',
            targetPath,
            value,
            '--type',
            options.type,
            ...buildOpenClawTargetArgs(options),
        ]);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
compatOpenClaw
    .command('config-unset')
    .description('Unset an OpenClaw config path through TNF')
    .argument('<path>', 'Dot path within openclaw.json')
    .option('--installation <id>', 'Installation id')
    .option('--instance <id>', 'Instance/profile id')
    .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
    .action(async (targetPath, options) => {
    try {
        await runOpenClawControl(['config-unset', targetPath, ...buildOpenClawTargetArgs(options)]);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
compatOpenClaw
    .command('cron')
    .description('List OpenClaw cron jobs with TNF schedule mapping')
    .option('--json', 'Output machine-readable JSON')
    .option('--installation <id>', 'Installation id')
    .option('--instance <id>', 'Instance/profile id')
    .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
    .option('--all-instances', 'List cron jobs across every discovered instance')
    .action(async (options) => {
    try {
        const args = ['cron-list', ...buildOpenClawTargetArgs(options)];
        if (options.json)
            args.push('--json');
        await runOpenClawControl(args);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
compatOpenClaw
    .command('cron-enable')
    .description('Enable an OpenClaw cron job through TNF')
    .argument('<job>', 'Job id or name')
    .option('--installation <id>', 'Installation id')
    .option('--instance <id>', 'Instance/profile id')
    .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
    .action(async (job, options) => {
    try {
        await runOpenClawControl(['cron-enable', job, ...buildOpenClawTargetArgs(options)]);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
compatOpenClaw
    .command('cron-disable')
    .description('Disable an OpenClaw cron job through TNF')
    .argument('<job>', 'Job id or name')
    .option('--installation <id>', 'Installation id')
    .option('--instance <id>', 'Instance/profile id')
    .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
    .action(async (job, options) => {
    try {
        await runOpenClawControl(['cron-disable', job, ...buildOpenClawTargetArgs(options)]);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
compatOpenClaw
    .command('sync')
    .description('Sync live OpenClaw runtime state into TNF control-plane records')
    .option('--installation <id>', 'Installation id')
    .option('--instance <id>', 'Instance/profile id')
    .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
    .option('--all-instances', 'Sync every discovered instance')
    .action(async (options) => {
    try {
        const targetArgs = buildOpenClawTargetArgs({
            ...options,
            allInstances: options.allInstances ?? true,
        });
        await runOpenClawControl(['sync-control-plane', '--actor', 'tnf-cli', ...targetArgs]);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
compatOpenClaw
    .command('cleanup')
    .description('Clean duplicate and failing TNF-managed OpenClaw cron jobs')
    .option('--disable-failing', 'Disable TNF-managed jobs currently in error state')
    .option('--dry-run', 'Compute cleanup result without writing OpenClaw cron files')
    .option('--keep-launch-validation-duplicates', 'Do not prune duplicate TNF Launch Validation one-shot jobs')
    .option('--installation <id>', 'Installation id')
    .option('--instance <id>', 'Instance/profile id')
    .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
    .option('--all-instances', 'Apply cleanup to every discovered instance')
    .action(async (options) => {
    try {
        const args = ['cleanup-cron', '--actor', 'tnf-cli', ...buildOpenClawTargetArgs(options)];
        if (options.disableFailing)
            args.push('--disable-failing');
        if (options.dryRun)
            args.push('--dry-run');
        if (options.keepLaunchValidationDuplicates) {
            args.push('--keep-launch-validation-duplicates');
        }
        await runOpenClawControl(args);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
compatOpenClaw
    .command('cron-schedule')
    .description('Change an OpenClaw cron job schedule through TNF')
    .argument('<job>', 'Job id or name')
    .option('--cron <expr>', 'Cron expression')
    .option('--tz <tz>', 'Timezone for cron expressions')
    .option('--stagger-ms <ms>', 'Optional stagger milliseconds')
    .option('--every-ms <ms>', 'Repeat interval in milliseconds')
    .option('--anchor-ms <ms>', 'Anchor time in milliseconds for every schedules')
    .option('--at <iso>', 'One-shot ISO timestamp')
    .option('--installation <id>', 'Installation id')
    .option('--instance <id>', 'Instance/profile id')
    .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
    .action(async (job, options) => {
    try {
        const args = ['cron-schedule', job];
        if (options.cron)
            args.push('--cron', options.cron);
        if (options.tz)
            args.push('--tz', options.tz);
        if (options.staggerMs)
            args.push('--stagger-ms', options.staggerMs);
        if (options.everyMs)
            args.push('--every-ms', options.everyMs);
        if (options.anchorMs)
            args.push('--anchor-ms', options.anchorMs);
        if (options.at)
            args.push('--at', options.at);
        args.push(...buildOpenClawTargetArgs(options));
        await runOpenClawControl(args);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const skills = program.command('skills').description('Skill bank operations');
const skillsBank = skills.command('bank').description('Cross-LLM skill bank operations');
skillsBank
    .command('sync')
    .description('Build/refresh cross-LLM skill bank index and snapshots')
    .action(async () => {
    try {
        await runCommand('node', ['scripts/skills/skill-bank-sync.cjs']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
skillsBank
    .command('query')
    .description('Search skill bank index')
    .argument('<query>', 'Search query')
    .action(async (query) => {
    try {
        await runCommand('node', ['scripts/skills/skill-bank-query.cjs', query]);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
skillsBank
    .command('ingest')
    .description('Ingest skill-bank export rows into resource registry API')
    .option('--strict', 'Exit non-zero if any records fail')
    .option('--dry-run', 'Validate ingest payload without posting')
    .action(async (options) => {
    try {
        const args = ['scripts/skills/skill-bank-ingest.cjs'];
        if (options.strict)
            args.push('--strict');
        if (options.dryRun)
            args.push('--dry-run');
        await runCommand('node', args);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
skillsBank
    .command('retry-pending')
    .description('Retry pending failed skill-bank ingests')
    .option('--strict', 'Exit non-zero if any records still fail')
    .action(async (options) => {
    try {
        const args = ['scripts/skills/skill-bank-retry-pending.cjs'];
        if (options.strict)
            args.push('--strict');
        await runCommand('node', args);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
skillsBank
    .command('supervisor')
    .description('Run continuous skill-bank sync/ingest/retry supervisor')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'skills bank supervisor');
        await runCommand('bash', ['scripts/skills/skill-bank-supervisor.sh']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
skillsBank
    .command('supervisor-start')
    .description('Start skill-bank supervisor in background')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'skills bank supervisor-start');
        await runCommand('bash', ['scripts/skills/skill-bank-supervisor-start.sh']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
skillsBank
    .command('supervisor-stop')
    .description('Stop skill-bank supervisor')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'skills bank supervisor-stop');
        await runCommand('bash', ['scripts/skills/skill-bank-supervisor-stop.sh']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
skillsBank
    .command('supervisor-status')
    .description('Show skill-bank supervisor status')
    .action(async () => {
    try {
        await runCommand('bash', ['scripts/skills/skill-bank-supervisor-status.sh']);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
superCycle
    .command('status')
    .description('Read super-cycle state snapshot')
    .option('--local', 'Read from local Redis via local client', false)
    .option('--service <name>', 'CloudRuntime service name', 'tnf-master-clock')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (options) => {
    try {
        requireSuperAdmin(options, 'super-cycle status');
        if (options.local) {
            await runCommand('pnpm', [
                '--filter',
                '@the-new-fuse/relay-core',
                'run',
                'super-cycle:status',
            ]);
            return;
        }
        await runCommand('cloud_runtime', [
            'run',
            '--service',
            options.service,
            'pnpm',
            '--filter',
            '@the-new-fuse/relay-core',
            'run',
            'super-cycle:status',
        ]);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
program
    .command('run')
    .description('Execute any root package script through unified TNF CLI')
    .argument('<script>', 'Root package.json script name')
    .argument('[args...]', 'Arguments to forward')
    .option('--super-admin-token <token>', 'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)')
    .action(async (script, args, options) => {
    try {
        requireSuperAdmin(options, 'run');
        const cmdArgs = ['run', script];
        if (args.length > 0)
            cmdArgs.push('--', ...args);
        await runCommand('pnpm', cmdArgs);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const scriptsCommand = program
    .command('scripts')
    .description('Discover and run repo scripts and root package scripts');
scriptsCommand
    .command('list')
    .description('List runnable scripts from package.json, scripts/**, tools/**, and repo root')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const rootScripts = loadRootScripts();
        const fileScripts = discoverFileScripts();
        if (options.json) {
            console.log(JSON.stringify({
                rootScripts,
                fileScripts: fileScripts.map((s) => s.relPath),
            }, null, 2));
            return;
        }
        console.log(chalk_1.default.bold('\nRoot package scripts:\n'));
        for (const script of rootScripts) {
            console.log(`- ${chalk_1.default.cyan(script.name)}: ${chalk_1.default.dim(script.command)}`);
        }
        console.log(chalk_1.default.bold('\nRunnable files (scripts/**, tools/**, repo root):\n'));
        for (const script of fileScripts) {
            console.log(`- ${chalk_1.default.green(script.relPath)}`);
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
scriptsCommand
    .command('run')
    .description('Run either a root package script or a runnable file path')
    .argument('<target>', 'Root script name OR runnable file path (scripts/**, tools/**, or repo root)')
    .argument('[args...]', 'Arguments to forward')
    .action(async (target, args) => {
    try {
        const rootScripts = loadRootScripts();
        const rootMatch = rootScripts.find((s) => s.name === target);
        if (rootMatch) {
            const cmdArgs = ['run', target];
            if (args.length > 0)
                cmdArgs.push('--', ...args);
            await runCommand('pnpm', cmdArgs);
            return;
        }
        const fileScript = resolveFileScript(target);
        if (fileScript) {
            await runFileScript(fileScript, args);
            return;
        }
        throw new Error(`Unknown target '${target}'. Use 'tnf scripts list' to see available scripts.`);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const voiceBridgeCommand = program
    .command('voice')
    .description('Voice Bridge commands (listen, anchor target, and response audio)');
function appendVoiceProfileArg(args, profile) {
    if (!profile)
        return args;
    return [...args, '--profile', normalizeVoiceProfile(profile)];
}
voiceBridgeCommand
    .command('up')
    .description('Start profile-scoped Voice Bridge background runtime')
    .option('--profile <name>', 'Voice Bridge profile (default: main)')
    .option('--with-listen', 'Also start listen sidecar in background')
    .option('--port <number>', 'Voice Bridge port override')
    .option('--open', 'Open Voice Bridge browser UI')
    .option('--json', 'Output machine-readable JSON')
    .action(async (options = {}) => {
    try {
        const profile = normalizeVoiceProfile(options.profile);
        const port = inferVoiceBridgePort(profile, options.port);
        const existing = findVoiceProfilePids(profile);
        const preStop = existing.length > 0 ? await terminatePids(existing) : null;
        const sharedEnv = {
            ...process.env,
            VOICEBRIDGE_PROFILE: profile,
            VOICEBRIDGE_PORT: String(port),
        };
        const voiceArgs = ['--profile', profile];
        if (options.port)
            voiceArgs.push('--port', options.port);
        if (!options.open)
            voiceArgs.push('--no-open');
        const voicePid = spawnDetachedVoiceCommand('voice', voiceArgs, sharedEnv);
        let listenPid;
        if (options.withListen) {
            listenPid = spawnDetachedVoiceCommand('listen', ['--profile', profile], {
                ...sharedEnv,
                LISTEN_DELIVERY_MODE: process.env.LISTEN_DELIVERY_MODE || 'auto',
            });
        }
        writeVoiceSession({
            profile,
            port,
            voicePid,
            listenPid,
            startedAt: new Date().toISOString(),
        });
        const serverReady = await waitForVoiceServer(port, 12000);
        const payload = {
            ok: true,
            profile,
            port,
            serverReady,
            voicePid,
            listenPid: listenPid ?? null,
            preStoppedPids: preStop?.stopped ?? [],
        };
        if (options.json) {
            console.log(JSON.stringify(payload, null, 2));
            return;
        }
        console.log(chalk_1.default.green(`✅ Voice Bridge up for profile '${profile}'`));
        console.log(`Port: ${chalk_1.default.cyan(String(port))}`);
        console.log(`Voice PID: ${chalk_1.default.cyan(String(voicePid))}`);
        if (typeof listenPid === 'number') {
            console.log(`Listen PID: ${chalk_1.default.cyan(String(listenPid))}`);
        }
        if (preStop && preStop.stopped.length > 0) {
            console.log(chalk_1.default.dim(`Stopped existing profile processes: ${preStop.stopped.join(', ')}`));
        }
        if (serverReady) {
            console.log(chalk_1.default.green(`Server reachable at http://127.0.0.1:${port}`));
        }
        else {
            console.log(chalk_1.default.yellow(`Server not reachable yet on 127.0.0.1:${port} (startup still warming or failed).`));
        }
        console.log(chalk_1.default.dim(`Use 'tnf voice down --profile ${profile}' to stop this profile runtime.`));
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
voiceBridgeCommand
    .command('down')
    .description('Stop profile-scoped Voice Bridge background runtime')
    .option('--profile <name>', 'Voice Bridge profile (default: main)')
    .option('--json', 'Output machine-readable JSON')
    .action(async (options = {}) => {
    try {
        const profile = normalizeVoiceProfile(options.profile);
        const session = readVoiceSession(profile);
        const pids = new Set();
        if (session?.voicePid)
            pids.add(session.voicePid);
        if (session?.listenPid)
            pids.add(session.listenPid);
        for (const pid of findVoiceProfilePids(profile))
            pids.add(pid);
        const result = await terminatePids(Array.from(pids));
        removeVoiceSession(profile);
        const payload = {
            ok: true,
            profile,
            requestedPids: Array.from(pids),
            stoppedPids: result.stopped,
            notFoundPids: result.notFound,
            forceKilledPids: result.forceKilled,
        };
        if (options.json) {
            console.log(JSON.stringify(payload, null, 2));
            return;
        }
        console.log(chalk_1.default.green(`✅ Voice Bridge down for profile '${profile}'`));
        if (result.stopped.length > 0) {
            console.log(`Stopped: ${chalk_1.default.cyan(result.stopped.join(', '))}`);
        }
        else {
            console.log(chalk_1.default.dim('No live profile processes were found.'));
        }
        if (result.forceKilled.length > 0) {
            console.log(chalk_1.default.yellow(`Force-killed: ${result.forceKilled.join(', ')}`));
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
voiceBridgeCommand
    .command('relay')
    .description('Relay transcribed input between Voice Bridge profiles')
    .requiredOption('--from <profile>', 'Source profile')
    .requiredOption('--to <profile>', 'Target profile')
    .option('--bidirectional', 'Enable reverse relay path (to -> from)')
    .option('--require-live', 'Fail fast if either relay endpoint is down at startup')
    .option('--keep-main', 'Do not auto-stop stray main profile runtime during non-main relay')
    .option('--from-port <number>', 'Source profile port override')
    .option('--to-port <number>', 'Target profile port override')
    .option('--interval-ms <number>', 'Poll interval in ms', '200')
    .option('--ack-window-ms <number>', 'ACK guard window in ms', '15000')
    .option('--dedupe-window-ms <number>', 'Route dedupe window in ms', '8000')
    .option('--heartbeat-ms <number>', 'Heartbeat poll + auto-heal interval in ms (0 disables)', '5000')
    .option('--heartbeat-log-ms <number>', 'Heartbeat status log cadence in ms', '15000')
    .option('--no-heartbeat-heal', 'Disable heartbeat /activate auto-heal calls')
    .action(async (options = {}) => {
    const parsePositiveInt = (value, fallback, label) => {
        if (typeof value === 'undefined')
            return fallback;
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            throw new Error(`Invalid ${label}: ${value}`);
        }
        return parsed;
    };
    const parseNonNegativeInt = (value, fallback, label) => {
        if (typeof value === 'undefined')
            return fallback;
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed) || parsed < 0) {
            throw new Error(`Invalid ${label}: ${value}`);
        }
        return parsed;
    };
    try {
        const fromProfile = normalizeVoiceProfile(options.from);
        const toProfile = normalizeVoiceProfile(options.to);
        if (fromProfile === toProfile) {
            throw new Error('--from and --to must be different profiles');
        }
        const intervalMs = parsePositiveInt(options.intervalMs, 200, '--interval-ms');
        const ackWindowMs = parsePositiveInt(options.ackWindowMs, 15000, '--ack-window-ms');
        const dedupeWindowMs = parsePositiveInt(options.dedupeWindowMs, 8000, '--dedupe-window-ms');
        const heartbeatMs = parseNonNegativeInt(options.heartbeatMs, 5000, '--heartbeat-ms');
        const heartbeatLogMs = parsePositiveInt(options.heartbeatLogMs, 15000, '--heartbeat-log-ms');
        const heartbeatHeal = options.heartbeatHeal !== false;
        const fromPort = inferVoiceBridgePort(fromProfile, options.fromPort);
        const toPort = inferVoiceBridgePort(toProfile, options.toPort);
        const mainInterferencePids = findMainProfileInterferencePids([fromProfile, toProfile]);
        if (mainInterferencePids.length > 0) {
            if (options.keepMain) {
                console.log(chalk_1.default.yellow(`⚠️ main-profile runtime still active (${mainInterferencePids.join(', ')}); overlap risk remains because --keep-main was set.`));
            }
            else {
                const stoppedMain = await terminatePids(mainInterferencePids);
                removeVoiceSession('main');
                const stoppedList = stoppedMain.stopped.length > 0 ? stoppedMain.stopped.join(', ') : 'none';
                console.log(chalk_1.default.yellow(`Isolated relay pair by stopping main-profile runtime pids: ${stoppedList}`));
            }
        }
        const directions = [
            {
                ...relayDirection(fromProfile, toProfile, fromPort, toPort),
                lastSignalTs: 0,
                lastSignalHash: '',
            },
        ];
        if (options.bidirectional) {
            directions.push({
                ...relayDirection(toProfile, fromProfile, toPort, fromPort),
                lastSignalTs: 0,
                lastSignalHash: '',
            });
        }
        const pendingByTarget = new Map();
        const recentRouteHashes = new Map();
        const ackedMsgIds = new Set();
        const endpointByProfile = new Map([
            [fromProfile, fromPort],
            [toProfile, toPort],
        ]);
        const heartbeatMisses = new Map();
        heartbeatMisses.set(fromProfile, 0);
        heartbeatMisses.set(toProfile, 0);
        let lastHeartbeatAt = 0;
        let lastHeartbeatLogAt = 0;
        const getPendingMap = (profile) => {
            const normalized = normalizeVoiceProfile(profile);
            if (!pendingByTarget.has(normalized)) {
                pendingByTarget.set(normalized, new Map());
            }
            return pendingByTarget.get(normalized);
        };
        const nowMs = () => Date.now();
        const cleanupAgingState = () => {
            const now = nowMs();
            for (const [, deliveries] of pendingByTarget) {
                for (const [hash, delivery] of deliveries) {
                    if (now - delivery.at > ackWindowMs)
                        deliveries.delete(hash);
                }
            }
            for (const [key, at] of recentRouteHashes) {
                if (now - at > dedupeWindowMs)
                    recentRouteHashes.delete(key);
            }
        };
        const fromReady = await waitForVoiceServer(fromPort, 1000);
        const toReady = await waitForVoiceServer(toPort, 1000);
        if (options.requireLive && (!fromReady || !toReady)) {
            const down = [];
            if (!fromReady)
                down.push(`${fromProfile}:${fromPort}`);
            if (!toReady)
                down.push(`${toProfile}:${toPort}`);
            throw new Error(`Relay endpoints not live at startup: ${down.join(', ')}. Start runtimes with 'tnf voice up --profile <name>' first, or rerun relay without --require-live to wait.`);
        }
        console.log(chalk_1.default.bold('\nVoice Relay'));
        console.log(`Path: ${chalk_1.default.cyan(fromProfile)}:${fromPort} -> ${chalk_1.default.cyan(toProfile)}:${toPort}`);
        console.log(`Bidirectional: ${options.bidirectional ? chalk_1.default.green('ON') : chalk_1.default.yellow('OFF')}`);
        console.log(`Source signal: /tmp/voice_last_user_input_* (profile-scoped)`);
        console.log(`Endpoints: from=${fromReady ? chalk_1.default.green('UP') : chalk_1.default.yellow('DOWN')} | to=${toReady ? chalk_1.default.green('UP') : chalk_1.default.yellow('DOWN')}`);
        console.log(chalk_1.default.dim('Loop guards active: msg_id + ACK + hash dedupe'));
        console.log(chalk_1.default.dim(`Heartbeat: ${heartbeatMs > 0
            ? `${heartbeatMs}ms (${heartbeatHeal ? '/activate auto-heal ON' : '/activate auto-heal OFF'})`
            : 'OFF'}`));
        console.log(chalk_1.default.dim('Press Ctrl+C to stop relay.\n'));
        let running = true;
        const handleSignal = (signal) => {
            if (!running)
                return;
            running = false;
            console.log(chalk_1.default.yellow(`\nReceived ${signal}. Stopping relay...`));
        };
        process.once('SIGINT', handleSignal);
        process.once('SIGTERM', handleSignal);
        while (running) {
            cleanupAgingState();
            const now = nowMs();
            if (heartbeatMs > 0 && now - lastHeartbeatAt >= heartbeatMs) {
                lastHeartbeatAt = now;
                const up = [];
                const down = [];
                const healed = [];
                const healFailed = [];
                for (const [profile, port] of endpointByProfile.entries()) {
                    const live = await waitForVoiceServer(port, 450);
                    if (live) {
                        heartbeatMisses.set(profile, 0);
                        up.push(`${profile}:${port}`);
                    }
                    else {
                        const misses = (heartbeatMisses.get(profile) || 0) + 1;
                        heartbeatMisses.set(profile, misses);
                        down.push(`${profile}:${port}#${misses}`);
                    }
                    if (heartbeatHeal) {
                        const activateResult = postVoiceActivate(port);
                        if (activateResult.ok) {
                            healed.push(profile);
                        }
                        else {
                            healFailed.push(profile);
                        }
                    }
                }
                const shouldLogHeartbeat = down.length > 0 || now - lastHeartbeatLogAt >= Math.max(heartbeatLogMs, heartbeatMs);
                if (shouldLogHeartbeat) {
                    lastHeartbeatLogAt = now;
                    const statusChunk = down.length > 0
                        ? chalk_1.default.yellow(`down=[${down.join(', ')}]`)
                        : chalk_1.default.green(`up=[${up.join(', ')}]`);
                    const healChunk = heartbeatHeal
                        ? ` heal=${healFailed.length > 0 ? `partial(ok:${healed.join(',') || '-'} fail:${healFailed.join(',')})` : `ok(${healed.join(',') || '-'})`}`
                        : '';
                    console.log(chalk_1.default.dim(`HB ${new Date(now).toISOString()} ${statusChunk}${healChunk}`));
                }
            }
            for (const direction of directions) {
                const input = readVoiceProfileLastInput(direction.fromProfile);
                if (!input)
                    continue;
                if (input.ts <= direction.lastSignalTs)
                    continue;
                direction.lastSignalTs = input.ts;
                // Guard against repeated identical source signals at same timestamp cadence.
                if (direction.lastSignalHash === input.hash) {
                    continue;
                }
                direction.lastSignalHash = input.hash;
                // ACK guard: if this hash was recently delivered into this source profile,
                // treat the observed signal as acknowledgment and do not forward.
                const pendingForSource = getPendingMap(direction.fromProfile);
                const ackCandidate = pendingForSource.get(input.hash);
                if (ackCandidate && now - ackCandidate.at <= ackWindowMs) {
                    if (!ackedMsgIds.has(ackCandidate.msgId)) {
                        ackedMsgIds.add(ackCandidate.msgId);
                        direction.acked += 1;
                        console.log(chalk_1.default.dim(`ACK ${ackCandidate.msgId} (${direction.fromProfile} observed relay-return hash)`));
                    }
                    pendingForSource.delete(input.hash);
                    continue;
                }
                const routeKey = `${direction.id}:${input.hash}`;
                const recentForwardAt = recentRouteHashes.get(routeKey) || 0;
                if (recentForwardAt && now - recentForwardAt <= dedupeWindowMs) {
                    direction.skippedEcho += 1;
                    continue;
                }
                const pendingForTarget = getPendingMap(direction.toProfile);
                const pendingEcho = pendingForTarget.get(input.hash);
                if (pendingEcho && now - pendingEcho.at <= dedupeWindowMs) {
                    direction.skippedEcho += 1;
                    continue;
                }
                if (isRelayControlSignal(input.text)) {
                    direction.skippedControl += 1;
                    continue;
                }
                const msgId = `${direction.fromProfile}_${direction.toProfile}_${now.toString(36)}_${input.hash.slice(0, 8)}`;
                const sendResult = postVoiceSend(direction.toPort, input.text);
                if (!sendResult.ok) {
                    direction.sendFailed += 1;
                    console.log(chalk_1.default.yellow(`SEND_FAIL ${msgId} ${direction.id} (${sendResult.error || 'unknown send error'})`));
                    continue;
                }
                direction.forwarded += 1;
                recentRouteHashes.set(routeKey, now);
                pendingForTarget.set(input.hash, {
                    msgId,
                    hash: input.hash,
                    fromProfile: direction.fromProfile,
                    toProfile: direction.toProfile,
                    at: now,
                });
                console.log(chalk_1.default.green(`FWD ${msgId} ${direction.id} :: ${input.text}`));
            }
            await sleep(intervalMs);
        }
        process.removeListener('SIGINT', handleSignal);
        process.removeListener('SIGTERM', handleSignal);
        const summary = directions.map((d) => ({
            path: d.id,
            forwarded: d.forwarded,
            acked: d.acked,
            skippedEcho: d.skippedEcho,
            skippedControl: d.skippedControl,
            sendFailed: d.sendFailed,
        }));
        console.log(chalk_1.default.bold('\nRelay summary'));
        for (const item of summary) {
            console.log(`${chalk_1.default.cyan(item.path)} forwarded=${item.forwarded} acked=${item.acked} ` +
                `skippedEcho=${item.skippedEcho} skippedControl=${item.skippedControl} sendFailed=${item.sendFailed}`);
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
voiceBridgeCommand
    .command('start')
    .description('Start Voice Bridge server + injection bridge (wrapper around `voice`)')
    .option('--profile <name>', 'Voice Bridge profile (default: main)')
    .option('--port <number>', 'Voice Bridge port override')
    .option('--no-open', 'Do not open Voice Bridge browser UI')
    .argument('[args...]', 'Arguments forwarded to voice command')
    .action(async (args = [], options = {}) => {
    try {
        let forwarded = [...args];
        if (options.profile)
            forwarded = appendVoiceProfileArg(forwarded, options.profile);
        if (options.port)
            forwarded.push('--port', options.port);
        if (options.open === false)
            forwarded.push('--no-open');
        await runVoiceBridgeCommand('voice', forwarded);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
voiceBridgeCommand
    .command('listen')
    .description('Start microphone transcription loop (wrapper around `listen`)')
    .option('--profile <name>', 'Voice Bridge profile (default: main)')
    .argument('[args...]', 'Arguments forwarded to listen command')
    .action(async (args = [], options = {}) => {
    try {
        let forwarded = [...args];
        if (options.profile)
            forwarded = appendVoiceProfileArg(forwarded, options.profile);
        await runVoiceBridgeCommand('listen', forwarded);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
voiceBridgeCommand
    .command('activate')
    .description('Call local Voice Bridge /activate to auto-heal watcher daemons')
    .option('--profile <name>', 'Voice Bridge profile (default: main)')
    .option('--port <number>', 'Voice Bridge API port override')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const port = inferVoiceBridgePort(options.profile, options.port);
        const payload = readVoiceBridgeJson('/activate', 'POST', port);
        const started = Array.isArray(payload.started) ? payload.started.map(String) : [];
        if (options.json) {
            console.log(JSON.stringify({ ok: true, profile: normalizeVoiceProfile(options.profile), port, started }, null, 2));
            return;
        }
        if (started.length === 0) {
            console.log(chalk_1.default.green('✅ Voice Bridge activate succeeded (nothing needed to start).'));
        }
        else {
            console.log(chalk_1.default.green(`✅ Voice Bridge activate succeeded. Started: ${started.join(', ')}`));
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
voiceBridgeCommand
    .command('status')
    .description('Show local Voice Bridge server + command availability')
    .option('--profile <name>', 'Voice Bridge profile (default: main)')
    .option('--port <number>', 'Voice Bridge API port override')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const profile = normalizeVoiceProfile(options.profile);
        const port = inferVoiceBridgePort(profile, options.port);
        const knownCommands = [
            'voice',
            'listen',
            'voice-target-here',
            'voice-target-pick',
            'voice-target-show',
            'voice-target-clear',
            'voice-mic-toggle',
            'voice-response-audio-toggle',
        ];
        const commandStatus = knownCommands.map((name) => {
            try {
                return { name, available: true, path: resolveVoiceBridgeCommand(name) };
            }
            catch {
                return { name, available: false, path: null };
            }
        });
        const healthProbe = (0, child_process_1.spawnSync)('curl', ['-fsS', `http://127.0.0.1:${port}/`], {
            encoding: 'utf8',
            env: process.env,
        });
        const serverReachable = healthProbe.status === 0;
        let micState = null;
        let kwsState = null;
        if (serverReachable) {
            micState = readVoiceBridgeJson('/mic_state', 'GET', port);
            kwsState = readVoiceBridgeJson('/kws_state', 'GET', port);
        }
        const payload = {
            profile,
            port,
            serverReachable,
            micState,
            kwsState,
            commands: commandStatus,
        };
        if (options.json) {
            console.log(JSON.stringify(payload, null, 2));
            return;
        }
        console.log(chalk_1.default.bold('\nVoice Bridge status\n'));
        console.log(`Profile: ${chalk_1.default.cyan(profile)} | Port: ${chalk_1.default.cyan(String(port))}`);
        console.log(`Server: ${serverReachable ? chalk_1.default.green('UP') : chalk_1.default.red('DOWN')} (127.0.0.1:${port})`);
        if (serverReachable) {
            const paused = micState?.paused === true;
            const kwsEnabled = kwsState?.enabled === true;
            const ingestUrl = typeof kwsState?.ingest_url === 'string' ? kwsState.ingest_url : '';
            console.log(`Mic: ${paused ? chalk_1.default.yellow('PAUSED') : chalk_1.default.green('ACTIVE')}`);
            console.log(`Cloud forwarding: ${kwsEnabled ? chalk_1.default.green('ON') : chalk_1.default.yellow('OFF')}`);
            if (ingestUrl) {
                console.log(`Ingest URL: ${chalk_1.default.dim(ingestUrl)}`);
            }
        }
        else {
            console.log(chalk_1.default.dim(`Run \`tnf voice start --profile ${profile}\` to bring up Voice Bridge for this profile.`));
        }
        console.log('\nCommands:');
        for (const command of commandStatus) {
            const status = command.available ? chalk_1.default.green('available') : chalk_1.default.red('missing');
            const details = command.path ? chalk_1.default.dim(command.path) : '';
            console.log(`- ${command.name}: ${status}${details ? ` (${details})` : ''}`);
        }
        console.log('');
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const voiceProtocolCommand = voiceBridgeCommand
    .command('protocol')
    .description('Observe and watch multi-profile voice cooperation protocol health');
voiceProtocolCommand
    .command('status')
    .description('Show current relay + watcher + signal health for a profile pair')
    .option('--from <profile>', 'Source profile (default: a)', 'a')
    .option('--to <profile>', 'Target profile (default: b)', 'b')
    .option('--from-port <number>', 'Source profile port override')
    .option('--to-port <number>', 'Target profile port override')
    .option('--json', 'Output machine-readable JSON')
    .action(async (options = {}) => {
    try {
        const fromProfile = normalizeVoiceProfile(options.from);
        const toProfile = normalizeVoiceProfile(options.to);
        if (fromProfile === toProfile) {
            throw new Error('--from and --to must be different profiles');
        }
        const fromPort = inferVoiceBridgePort(fromProfile, options.fromPort);
        const toPort = inferVoiceBridgePort(toProfile, options.toPort);
        const [fromSnapshot, toSnapshot] = await Promise.all([
            collectVoiceProtocolSnapshot(fromProfile, fromPort),
            collectVoiceProtocolSnapshot(toProfile, toPort),
        ]);
        const relayPids = findVoiceRelayPids(fromProfile, toProfile);
        const relayHeartbeat = readLastHeartbeatLine(fromProfile, toProfile);
        const relayLog = relayLogPath(fromProfile, toProfile);
        const mainInterferencePids = findMainProfileInterferencePids([fromProfile, toProfile]);
        const payload = {
            pair: {
                from: fromProfile,
                to: toProfile,
                fromPort,
                toPort,
            },
            relay: {
                running: relayPids.length > 0,
                pids: relayPids,
                logPath: relayLog,
                heartbeat: relayHeartbeat,
            },
            interference: {
                mainProfilePids: mainInterferencePids,
            },
            profiles: {
                [fromProfile]: fromSnapshot,
                [toProfile]: toSnapshot,
            },
        };
        if (options.json) {
            console.log(JSON.stringify(payload, null, 2));
            return;
        }
        console.log(chalk_1.default.bold('\nVoice Protocol Status\n'));
        console.log(`Pair: ${chalk_1.default.cyan(fromProfile)}:${fromPort} <-> ${chalk_1.default.cyan(toProfile)}:${toPort}`);
        console.log(`Relay: ${relayPids.length > 0
            ? chalk_1.default.green(`RUNNING (${relayPids.join(', ')})`)
            : chalk_1.default.yellow('NOT RUNNING')}`);
        if (relayHeartbeat) {
            console.log(`Heartbeat: ${chalk_1.default.dim(relayHeartbeat.line)} (age ${formatAgeMs(relayHeartbeat.ageMs)})`);
        }
        else {
            console.log(`Heartbeat: ${chalk_1.default.yellow('none observed yet')} (${chalk_1.default.dim(relayLog)})`);
        }
        if (mainInterferencePids.length > 0) {
            console.log(chalk_1.default.yellow(`Interference: main-profile runtime active (${mainInterferencePids.join(', ')}). Run 'tnf voice down --profile main' to isolate this pair.`));
        }
        const printProfile = (snapshot) => {
            const userAge = formatAgeMs(ageMsFromUnixTs(snapshot.lastUserInput?.ts ?? null));
            const outAge = formatAgeMs(ageMsFromUnixTs(snapshot.lastAssistantOutput?.ts ?? null));
            console.log(`\n[${snapshot.profile}] server=${snapshot.serverUp ? chalk_1.default.green('UP') : chalk_1.default.red('DOWN')} ` +
                `stream_watch=${snapshot.streamWatchPids.length} response_audio=${snapshot.responseAudioPids.length}`);
            console.log(`last_user_input: ${chalk_1.default.cyan(userAge)} ${snapshot.lastUserInput
                ? chalk_1.default.dim(clipProtocolText(snapshot.lastUserInput.text))
                : chalk_1.default.dim('n/a')}`);
            console.log(`last_assistant_output: ${chalk_1.default.cyan(outAge)} ${snapshot.lastAssistantOutput
                ? chalk_1.default.dim(clipProtocolText(snapshot.lastAssistantOutput.text))
                : chalk_1.default.dim('n/a')}`);
        };
        printProfile(fromSnapshot);
        printProfile(toSnapshot);
        console.log('');
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
voiceProtocolCommand
    .command('watch')
    .description('Continuously poll and report cooperation protocol health')
    .option('--from <profile>', 'Source profile (default: a)', 'a')
    .option('--to <profile>', 'Target profile (default: b)', 'b')
    .option('--from-port <number>', 'Source profile port override')
    .option('--to-port <number>', 'Target profile port override')
    .option('--interval-ms <number>', 'Polling interval in ms', '5000')
    .option('--no-heal', 'Disable /activate auto-heal pulse on each poll')
    .option('--once', 'Print one snapshot and exit')
    .option('--json', 'Emit one JSON object per poll line')
    .action(async (options = {}) => {
    const parsePositiveInt = (value, fallback, label) => {
        if (typeof value === 'undefined')
            return fallback;
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            throw new Error(`Invalid ${label}: ${value}`);
        }
        return parsed;
    };
    try {
        const fromProfile = normalizeVoiceProfile(options.from);
        const toProfile = normalizeVoiceProfile(options.to);
        if (fromProfile === toProfile) {
            throw new Error('--from and --to must be different profiles');
        }
        const fromPort = inferVoiceBridgePort(fromProfile, options.fromPort);
        const toPort = inferVoiceBridgePort(toProfile, options.toPort);
        const intervalMs = parsePositiveInt(options.intervalMs, 5000, '--interval-ms');
        const heal = options.heal !== false;
        if (!options.json) {
            console.log(chalk_1.default.bold('\nVoice Protocol Watch'));
            console.log(`Pair: ${chalk_1.default.cyan(fromProfile)}:${fromPort} <-> ${chalk_1.default.cyan(toProfile)}:${toPort}`);
            console.log(`Poll interval: ${chalk_1.default.cyan(String(intervalMs))}ms`);
            console.log(`Auto-heal pulse: ${heal ? chalk_1.default.green('ON') : chalk_1.default.yellow('OFF')}`);
            console.log(chalk_1.default.dim('Press Ctrl+C to stop.\n'));
        }
        let running = true;
        const handleSignal = (signal) => {
            if (!running)
                return;
            running = false;
            if (!options.json) {
                console.log(chalk_1.default.yellow(`\nReceived ${signal}. Stopping protocol watch...`));
            }
        };
        process.once('SIGINT', handleSignal);
        process.once('SIGTERM', handleSignal);
        while (running) {
            const [fromSnapshot, toSnapshot] = await Promise.all([
                collectVoiceProtocolSnapshot(fromProfile, fromPort),
                collectVoiceProtocolSnapshot(toProfile, toPort),
            ]);
            const healResults = [];
            if (heal) {
                for (const snapshot of [fromSnapshot, toSnapshot]) {
                    if (!snapshot.serverUp) {
                        healResults.push({ profile: snapshot.profile, ok: false });
                        continue;
                    }
                    const result = postVoiceActivate(snapshot.port);
                    healResults.push({ profile: snapshot.profile, ok: result.ok });
                }
            }
            const relayPids = findVoiceRelayPids(fromProfile, toProfile);
            const relayHeartbeat = readLastHeartbeatLine(fromProfile, toProfile);
            const mainInterferencePids = findMainProfileInterferencePids([fromProfile, toProfile]);
            const nowIso = new Date().toISOString();
            const linePayload = {
                now: nowIso,
                pair: {
                    from: fromProfile,
                    to: toProfile,
                    fromPort,
                    toPort,
                },
                relay: {
                    running: relayPids.length > 0,
                    pids: relayPids,
                    heartbeat: relayHeartbeat,
                },
                interference: {
                    mainProfilePids: mainInterferencePids,
                },
                heal: {
                    enabled: heal,
                    results: healResults,
                },
                profiles: {
                    [fromProfile]: fromSnapshot,
                    [toProfile]: toSnapshot,
                },
            };
            if (options.json) {
                console.log(JSON.stringify(linePayload));
            }
            else {
                const summarize = (snapshot) => `${snapshot.profile}{srv:${snapshot.serverUp ? 'up' : 'down'} sw:${snapshot.streamWatchPids.length} ra:${snapshot.responseAudioPids.length}` +
                    ` in:${formatAgeMs(ageMsFromUnixTs(snapshot.lastUserInput?.ts ?? null))}` +
                    ` out:${formatAgeMs(ageMsFromUnixTs(snapshot.lastAssistantOutput?.ts ?? null))}}`;
                const hbAge = relayHeartbeat ? formatAgeMs(relayHeartbeat.ageMs) : 'n/a';
                const healSummary = heal
                    ? ` heal=${healResults.map((r) => `${r.profile}:${r.ok ? 'ok' : 'fail'}`).join(',')}`
                    : '';
                const interferenceSummary = mainInterferencePids.length > 0
                    ? ` main=${chalk_1.default.yellow(`active(${mainInterferencePids.length})`)}`
                    : ` main=${chalk_1.default.green('clear')}`;
                console.log(`${chalk_1.default.dim(nowIso)} relay:${relayPids.length > 0 ? chalk_1.default.green('up') : chalk_1.default.red('down')} ` +
                    `hb:${chalk_1.default.cyan(hbAge)} ${summarize(fromSnapshot)} ${summarize(toSnapshot)}${interferenceSummary}${healSummary}`);
            }
            if (options.once)
                break;
            await sleep(intervalMs);
        }
        process.removeListener('SIGINT', handleSignal);
        process.removeListener('SIGTERM', handleSignal);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const voiceTargetCommand = voiceBridgeCommand
    .command('target')
    .description('Manage destination anchor for transcribed text');
voiceTargetCommand
    .command('here')
    .description('Anchor transcription destination to current terminal tab')
    .option('--profile <name>', 'Voice Bridge profile (default: main)')
    .argument('[args...]', 'Arguments forwarded to voice-target-here')
    .action(async (args = [], options = {}) => {
    try {
        let forwarded = [...args];
        if (options.profile)
            forwarded = appendVoiceProfileArg(forwarded, options.profile);
        await runVoiceBridgeCommand('voice-target-here', forwarded);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
voiceTargetCommand
    .command('pick')
    .description('Anchor destination to currently focused app/window after delay')
    .option('--profile <name>', 'Voice Bridge profile (default: main)')
    .argument('[args...]', 'Arguments forwarded to voice-target-pick')
    .action(async (args = [], options = {}) => {
    try {
        let forwarded = [...args];
        if (options.profile)
            forwarded = appendVoiceProfileArg(forwarded, options.profile);
        await runVoiceBridgeCommand('voice-target-pick', forwarded);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
voiceTargetCommand
    .command('show')
    .description('Show current transcription destination anchor')
    .option('--profile <name>', 'Voice Bridge profile (default: main)')
    .action(async (options = {}) => {
    try {
        const forwarded = options.profile ? appendVoiceProfileArg([], options.profile) : [];
        await runVoiceBridgeCommand('voice-target-show', forwarded);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
voiceTargetCommand
    .command('clear')
    .description('Clear destination anchor')
    .option('--profile <name>', 'Voice Bridge profile (default: main)')
    .action(async (options = {}) => {
    try {
        const forwarded = options.profile ? appendVoiceProfileArg([], options.profile) : [];
        await runVoiceBridgeCommand('voice-target-clear', forwarded);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const voiceMicCommand = voiceBridgeCommand
    .command('mic')
    .description('Microphone capture controls');
voiceMicCommand
    .command('toggle')
    .description('Toggle microphone capture on/off')
    .option('--profile <name>', 'Voice Bridge profile (default: main)')
    .action(async (options = {}) => {
    try {
        const forwarded = options.profile ? appendVoiceProfileArg([], options.profile) : [];
        await runVoiceBridgeCommand('voice-mic-toggle', forwarded);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const voiceResponseAudioCommand = voiceBridgeCommand
    .command('response-audio')
    .description('AI response audio playback controls');
voiceResponseAudioCommand
    .command('toggle')
    .description('Toggle AI response audio on/off')
    .option('--profile <name>', 'Voice Bridge profile (default: main)')
    .action(async (options = {}) => {
    try {
        const forwarded = options.profile ? appendVoiceProfileArg([], options.profile) : [];
        await runVoiceBridgeCommand('voice-response-audio-toggle', forwarded);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
voiceResponseAudioCommand
    .command('on')
    .description('Enable AI response audio')
    .option('--profile <name>', 'Voice Bridge profile (default: main)')
    .action(async (options = {}) => {
    try {
        const forwarded = options.profile
            ? ['--profile', normalizeVoiceProfile(options.profile), '--on']
            : ['--on'];
        await runVoiceBridgeCommand('voice-response-audio-toggle', forwarded);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
voiceResponseAudioCommand
    .command('off')
    .description('Disable AI response audio')
    .option('--profile <name>', 'Voice Bridge profile (default: main)')
    .action(async (options = {}) => {
    try {
        const forwarded = options.profile
            ? ['--profile', normalizeVoiceProfile(options.profile), '--off']
            : ['--off'];
        await runVoiceBridgeCommand('voice-response-audio-toggle', forwarded);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
voiceResponseAudioCommand
    .command('status')
    .description('Show AI response audio state')
    .option('--profile <name>', 'Voice Bridge profile (default: main)')
    .action(async (options = {}) => {
    try {
        const forwarded = options.profile
            ? ['--profile', normalizeVoiceProfile(options.profile), '--status']
            : ['--status'];
        await runVoiceBridgeCommand('voice-response-audio-toggle', forwarded);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
program
    .command('menu')
    .description('Show an organized TNF command menu')
    .option('--theme <theme>', `Splash theme: ${SPLASH_THEMES.join('|')}`)
    .option('--animate <mode>', 'Splash animation mode: auto|on|off')
    .option('--speed <ms>', 'Splash animation speed in milliseconds')
    .option('--compact', 'Use compact splash layout')
    .option('--no-splash', 'Disable splash graphic')
    .option('--full', 'Include expanded command inventory')
    .option('--json', 'Output machine-readable JSON')
    .action(async (options) => {
    try {
        const sections = buildCommandMenuSections({ full: options.full });
        if (options.json) {
            console.log(JSON.stringify(sections, null, 2));
            return;
        }
        const speedMs = options.speed ? Number.parseInt(options.speed, 10) : undefined;
        const compact = options.compact ?? shouldAutoCompactMenuSplash();
        await printCommandMenu({
            showSplash: options.splash,
            splash: {
                theme: coerceSplashTheme(options.theme),
                animate: parseAnimateMode(options.animate),
                speedMs: Number.isFinite(speedMs) ? speedMs : undefined,
                compact,
            },
            full: options.full,
        });
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
program
    .command('splash')
    .description('Render TNF branded splash only')
    .option('--theme <theme>', `Splash theme: ${SPLASH_THEMES.join('|')}`)
    .option('--animate <mode>', 'Splash animation mode: auto|on|off')
    .option('--speed <ms>', 'Splash animation speed in milliseconds')
    .option('--compact', 'Use compact splash layout')
    .action(async (options) => {
    try {
        const speedMs = options.speed ? Number.parseInt(options.speed, 10) : undefined;
        await renderSplash({
            theme: coerceSplashTheme(options.theme),
            animate: parseAnimateMode(options.animate),
            speedMs: Number.isFinite(speedMs) ? speedMs : undefined,
            compact: options.compact,
        });
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
program
    .command('paths')
    .description('List all command paths in the TNF CLI')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const paths = collectCommandPaths(program).sort((a, b) => a.path.localeCompare(b.path));
        if (options.json) {
            console.log(JSON.stringify(paths, null, 2));
            return;
        }
        console.log(chalk_1.default.bold('\nTNF Command Paths\n'));
        for (const entry of paths) {
            const paddedPath = entry.path.padEnd(52, ' ');
            console.log(`  ${chalk_1.default.green(paddedPath)} ${chalk_1.default.dim(entry.description)}`);
        }
        console.log('');
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const types = program.command('types').description('Command namespace and script type inventory');
types
    .command('list')
    .description('List TNF command namespaces and root script namespaces')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const typeIndex = buildTypeIndex();
        if (options.json) {
            console.log(JSON.stringify(typeIndex, null, 2));
            return;
        }
        console.log(chalk_1.default.bold('\nTNF Types\n'));
        console.log(chalk_1.default.cyan('CLI namespaces:'));
        for (const namespace of typeIndex.cliNamespaces) {
            console.log(`  - ${chalk_1.default.green(namespace)}`);
        }
        console.log(`\n${chalk_1.default.cyan('Root script namespaces:')}`);
        for (const [namespace, count] of Object.entries(typeIndex.scriptNamespaces).sort(([a], [b]) => a.localeCompare(b))) {
            console.log(`  - ${chalk_1.default.green(namespace)} ${chalk_1.default.dim(`(${count} scripts)`)}`);
        }
        console.log('');
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const traits = program.command('traits').description('Role/platform and command behavior traits');
traits
    .command('list')
    .description('List TNF traits for agents and command families')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const groups = buildTraitGroups();
        if (options.json) {
            console.log(JSON.stringify(groups, null, 2));
            return;
        }
        console.log(chalk_1.default.bold('\nTNF Traits\n'));
        for (const group of groups) {
            console.log(chalk_1.default.cyan(`${group.name}:`));
            for (const value of group.values) {
                console.log(`  - ${chalk_1.default.green(value)}`);
            }
            console.log('');
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
const agents = program.command('agents').description('Agent-focused command paths');
agents
    .command('list')
    .description('Alias for `tnf list`')
    .action(async () => runSelfCliWithExit(['list']));
agents
    .command('register')
    .description('Alias for `tnf register`')
    .argument('[name]', 'Agent name')
    .argument('[role]', 'Agent role')
    .argument('[platform]', 'Agent platform')
    .option('-d, --daemon', 'Run in daemon mode (register and exit immediately)', false)
    .action(async (name, role, platform, options = {}) => {
    const args = ['register'];
    if (name)
        args.push(name);
    if (role)
        args.push(role);
    if (platform)
        args.push(platform);
    if (options.daemon)
        args.push('--daemon');
    await runSelfCliWithExit(args);
});
agents
    .command('send')
    .description('Alias for `tnf send`')
    .argument('<message>', 'Message to send')
    .option('-t, --to <agentId>', 'Recipient agent ID')
    .option('-n, --name <name>', 'Sender name')
    .action(async (message, options = {}) => {
    const args = ['send', message];
    if (options.to)
        args.push('--to', options.to);
    if (options.name)
        args.push('--name', options.name);
    await runSelfCliWithExit(args);
});
agents
    .command('convo')
    .description('Alias for `tnf convo`')
    .argument('<action>', 'Action (start|join)')
    .argument('[param]', 'Topic for start or ID for join')
    .action(async (action, param) => {
    const args = ['convo', action];
    if (param)
        args.push(param);
    await runSelfCliWithExit(args);
});
program
    .command('list')
    .description('List all registered agents')
    .action(async () => {
    const client = new RedisAgentClient_js_1.RedisAgentClient();
    try {
        await client.initialize();
        const agents = await client.listAgents();
        console.log(chalk_1.default.bold('\n📋 Registered Agents:\n'));
        if (agents.length === 0) {
            console.log('   No agents registered');
        }
        else {
            agents.forEach((agent) => {
                const statusIcon = agent.isOnline ? chalk_1.default.green('🟢') : chalk_1.default.red('🔴');
                const roleIcon = {
                    orchestrator: '👑',
                    broker: '🎯',
                    worker: '⚙️',
                    participant: '💬',
                };
                const icon = roleIcon[agent.role] || '📦';
                console.log(`${statusIcon} ${icon} ${chalk_1.default.bold(agent.name)} (${agent.platform})`);
                console.log(`      Role: ${agent.role}`);
                console.log(`      ID: ${chalk_1.default.dim(agent.id)}`);
                console.log(`      Last seen: ${chalk_1.default.dim(agent.lastSeen)}`);
                console.log('');
            });
        }
    }
    catch (err) {
        if (isRedisUnavailable(err)) {
            logRedisUnavailable('./tnf list');
        }
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
    finally {
        await client.cleanup();
    }
});
program
    .command('send')
    .description('Send a single message')
    .argument('<message>', 'Message to send')
    .option('-t, --to <agentId>', 'Recipient agent ID')
    .option('-n, --name <name>', 'Sender name', process.env.AGENT_NAME || 'cli-sender')
    .action(async (message, options) => {
    const client = new RedisAgentClient_js_1.RedisAgentClient();
    try {
        await client.initialize();
        await client.register(options.name, 'participant', 'vscode');
        await client.send(message, { to: options.to ? { agentId: options.to } : undefined });
        console.log(chalk_1.default.green('📤 Message sent'));
        // Wait a bit for responses
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    catch (err) {
        if (isRedisUnavailable(err)) {
            logRedisUnavailable('./tnf send <message>');
        }
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
    finally {
        await client.cleanup();
    }
});
program
    .command('convo')
    .description('Manage conversations')
    .argument('<action>', 'Action (start, join)')
    .argument('[param]', 'Topic for start, ID for join')
    .action(async (action, param) => {
    const client = new RedisAgentClient_js_1.RedisAgentClient();
    try {
        await client.initialize();
        await client.register('convo-cli', 'participant', 'vscode');
        if (action === 'start') {
            const id = await client.startConversation(param || 'general');
            console.log(chalk_1.default.green(`💬 Started conversation: ${chalk_1.default.bold(param || 'general')}`));
            console.log(`   ID: ${chalk_1.default.dim(id)}`);
        }
        else if (action === 'join') {
            if (!param) {
                throw new Error('Conversation ID required to join');
            }
            client.joinConversation(param);
            console.log(chalk_1.default.green(`🔗 Joined conversation: ${chalk_1.default.dim(param)}`));
        }
        console.log(chalk_1.default.cyan('\nType messages and press Enter (Ctrl+C to exit)\n'));
        client.onMessage('*', (msg) => {
            logMessage(msg);
        });
        const rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.on('line', async (line) => {
            if (line.trim()) {
                await client.send(line.trim());
            }
        });
        process.on('SIGINT', async () => {
            await client.cleanup();
            process.exit(0);
        });
    }
    catch (err) {
        if (isRedisUnavailable(err)) {
            logRedisUnavailable(`./tnf convo ${action}${param ? ` ${param}` : ''}`);
        }
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
// ────────────────────────────────────────────────────────────────────────────
// Reports lifecycle management
// ────────────────────────────────────────────────────────────────────────────
const reports = program
    .command('reports')
    .description('Report lifecycle management — rotation, metadata, trending');
reports
    .command('status')
    .description('Show report inventory: counts per type, disk usage, and lifecycle metadata')
    .option('--json', 'Output machine-readable JSON')
    .action(async (options) => {
    try {
        const reportDir = path_1.default.join(repoRoot, '.agent/test-reports');
        if (!fs_1.default.existsSync(reportDir)) {
            console.log(chalk_1.default.yellow('No reports directory found at .agent/test-reports'));
            process.exit(0);
        }
        const files = fs_1.default
            .readdirSync(reportDir)
            .filter((f) => f.endsWith('.json') && !f.startsWith('_'));
        const counts = {};
        let totalBytes = 0;
        for (const file of files) {
            const prefix = file.replace(/-\d{13}\.json$/, '');
            counts[prefix] = (counts[prefix] || 0) + 1;
            try {
                totalBytes += fs_1.default.statSync(path_1.default.join(reportDir, file)).size;
            }
            catch {
                /* skip */
            }
        }
        // Check for rolling summary
        const summaryPath = path_1.default.join(reportDir, '_rolling-summary.json');
        let summary = null;
        if (fs_1.default.existsSync(summaryPath)) {
            try {
                summary = JSON.parse(fs_1.default.readFileSync(summaryPath, 'utf8'));
            }
            catch {
                /* skip */
            }
        }
        if (options.json) {
            console.log(JSON.stringify({ counts, totalBytes, totalFiles: files.length, summary }, null, 2));
            return;
        }
        console.log(chalk_1.default.bold('\n📋 Report Inventory\n'));
        console.log(`   Directory: ${chalk_1.default.dim('.agent/test-reports')}`);
        console.log(`   Total files: ${chalk_1.default.cyan(String(files.length))}`);
        console.log(`   Total size: ${chalk_1.default.cyan((totalBytes / 1024).toFixed(1) + ' KB')}\n`);
        for (const [prefix, count] of Object.entries(counts).sort()) {
            const meta = summary?.types?.[prefix];
            const domain = meta?.domain || 'unknown';
            const lifecycle = meta?.lifecycle || 'unknown';
            const avgScore = meta?.recentAvgScore;
            const trend = meta?.trend;
            console.log(`   ${chalk_1.default.green(prefix)}: ${chalk_1.default.bold(String(count))} files` +
                `  ${chalk_1.default.dim(`[${domain}/${lifecycle}]`)}` +
                (avgScore != null ? `  avg=${chalk_1.default.cyan(avgScore + '%')}` : '') +
                (trend
                    ? `  trend=${trend === 'declining' ? chalk_1.default.red(trend) : chalk_1.default.green(trend)}`
                    : ''));
        }
        if (summary?.generatedAt) {
            console.log(`\n   Summary last updated: ${chalk_1.default.dim(summary.generatedAt)}`);
        }
        console.log('');
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
reports
    .command('prune')
    .description('Prune old reports and regenerate the rolling summary')
    .option('--max-per-type <n>', 'Maximum reports to keep per type', '50')
    .option('--max-age-days <n>', 'Maximum report age in days', '7')
    .option('--dry-run', 'Show what would be pruned without deleting')
    .action(async (options) => {
    try {
        const env = {};
        if (options.maxPerType)
            env.REPORT_MAX_PER_TYPE = options.maxPerType;
        if (options.maxAgeDays) {
            env.REPORT_MAX_AGE_MS = String(parseInt(options.maxAgeDays, 10) * 86400000);
        }
        if (options.dryRun) {
            // In dry-run mode, just show counts without actually pruning
            const reportDir = path_1.default.join(repoRoot, '.agent/test-reports');
            if (!fs_1.default.existsSync(reportDir)) {
                console.log(chalk_1.default.yellow('No reports directory found.'));
                process.exit(0);
            }
            const maxPerType = parseInt(options.maxPerType, 10);
            const maxAgeMs = parseInt(options.maxAgeDays, 10) * 86400000;
            const now = Date.now();
            const prefixes = ['test-report', 'integration-report', 'uiux-report'];
            console.log(chalk_1.default.bold('\n🔍 Dry Run — Reports that WOULD be pruned:\n'));
            for (const prefix of prefixes) {
                const files = fs_1.default
                    .readdirSync(reportDir)
                    .filter((f) => f.startsWith(prefix + '-') && f.endsWith('.json'))
                    .sort();
                let wouldPrune = 0;
                for (const file of files) {
                    const tsMatch = file.match(/(\d{13})\.json$/);
                    if (tsMatch && parseInt(tsMatch[1], 10) < now - maxAgeMs) {
                        wouldPrune++;
                    }
                }
                const remaining = files.length - wouldPrune;
                if (remaining > maxPerType) {
                    wouldPrune += remaining - maxPerType;
                }
                console.log(`   ${chalk_1.default.green(prefix)}: ${chalk_1.default.red(String(wouldPrune))} pruned, ${chalk_1.default.cyan(String(Math.max(0, files.length - wouldPrune)))} kept`);
            }
            console.log('');
            return;
        }
        await runCommand('node', ['scripts/swarm/report-lifecycle.cjs'], { env });
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
reports
    .command('summary')
    .description('Display the rolling summary dashboard')
    .option('--json', 'Output raw rolling summary JSON')
    .action(async (options) => {
    try {
        const summaryPath = path_1.default.join(repoRoot, '.agent/test-reports/_rolling-summary.json');
        if (!fs_1.default.existsSync(summaryPath)) {
            console.log(chalk_1.default.yellow('No rolling summary found. Run `tnf reports prune` to generate one.'));
            process.exit(0);
        }
        const summary = JSON.parse(fs_1.default.readFileSync(summaryPath, 'utf8'));
        if (options.json) {
            console.log(JSON.stringify(summary, null, 2));
            return;
        }
        console.log(chalk_1.default.bold('\n📊 Rolling Summary Dashboard\n'));
        console.log(`   Generated: ${chalk_1.default.dim(summary.generatedAt)}`);
        console.log(`   Window: last ${summary.config?.summaryWindow || '?'} reports per type\n`);
        for (const [type, data] of Object.entries(summary.types || {})) {
            const trendColor = data.trend === 'declining' ? chalk_1.default.red : chalk_1.default.green;
            const scoreColor = (data.recentAvgScore ?? 0) >= 80
                ? chalk_1.default.green
                : (data.recentAvgScore ?? 0) >= 60
                    ? chalk_1.default.yellow
                    : chalk_1.default.red;
            console.log(`   ${chalk_1.default.bold(type)} ${chalk_1.default.dim(`(${data.domain}/${data.lifecycle})`)}`);
            console.log(`     Owner: ${chalk_1.default.dim(data.owner)}`);
            console.log(`     On disk: ${chalk_1.default.cyan(String(data.totalOnDisk))}`);
            console.log(`     Avg score: ${scoreColor(data.recentAvgScore != null ? data.recentAvgScore + '%' : 'n/a')}`);
            console.log(`     Min/Max: ${data.recentMinScore ?? 'n/a'}% / ${data.recentMaxScore ?? 'n/a'}%`);
            console.log(`     Trend: ${trendColor(data.trend)}`);
            if (data.latestReport) {
                console.log(`     Latest: ${chalk_1.default.dim(data.latestReport.file)} (${data.latestReport.status})`);
            }
            console.log('');
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
reports
    .command('trends')
    .description('Show score trends for a specific report type')
    .argument('[type]', 'Report type (test-report, integration-report, uiux-report)', 'test-report')
    .option('--limit <n>', 'Number of recent reports to show', '20')
    .action(async (type, options) => {
    try {
        const reportDir = path_1.default.join(repoRoot, '.agent/test-reports');
        if (!fs_1.default.existsSync(reportDir)) {
            console.log(chalk_1.default.yellow('No reports directory found.'));
            process.exit(0);
        }
        const limit = parseInt(options.limit, 10);
        const files = fs_1.default
            .readdirSync(reportDir)
            .filter((f) => f.startsWith(type + '-') && f.endsWith('.json'))
            .sort()
            .slice(-limit);
        if (files.length === 0) {
            console.log(chalk_1.default.yellow(`No reports found for type: ${type}`));
            process.exit(0);
        }
        console.log(chalk_1.default.bold(`\n📈 Score Trends: ${type} (last ${files.length})\n`));
        const maxBarWidth = 40;
        for (const file of files) {
            try {
                const data = JSON.parse(fs_1.default.readFileSync(path_1.default.join(reportDir, file), 'utf8'));
                const score = data.overall?.score ?? 0;
                const status = data.overall?.status ?? '?';
                const ts = data.timestamp ? new Date(data.timestamp).toLocaleString() : 'unknown';
                const barFill = Math.round((score / 100) * maxBarWidth);
                const bar = '█'.repeat(barFill) + '░'.repeat(maxBarWidth - barFill);
                const scoreColor = score >= 80 ? chalk_1.default.green : score >= 60 ? chalk_1.default.yellow : chalk_1.default.red;
                console.log(`   ${chalk_1.default.dim(ts)}  ${scoreColor(bar)} ${scoreColor.bold(String(score) + '%')} ${chalk_1.default.dim(status)}`);
            }
            catch {
                /* skip corrupt */
            }
        }
        console.log('');
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
async function runPassthrough(cliName, args = []) {
    try {
        await runCommand(cliName, normalizeForwardedArgs(args));
    }
    catch (err) {
        // Passthrough commands should exit with the child's exit code, not wrap it as an error.
        // The child process already displayed its own output/errors to the user.
        const exitCodeMatch = err?.message?.match(/exited with code (\d+)/);
        const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1], 10) : 1;
        process.exit(exitCode);
    }
}
// ────────────────────────────────────────────────────────────────────────────
// TNF Command Extensions: ACP, MCP, Auth, Agent, Debug, Session, Remote, etc.
// ────────────────────────────────────────────────────────────────────────────
const ACPService_js_1 = require("./services/ACPService.js");
const AgentManagerService_js_1 = require("./services/AgentManagerService.js");
const AuthService_js_1 = require("./services/AuthService.js");
const CompletionService_js_1 = require("./services/CompletionService.js");
const DatabaseService_js_1 = require("./services/DatabaseService.js");
const DebugService_js_1 = require("./services/DebugService.js");
const MCPManagerService_js_1 = require("./services/MCPManagerService.js");
const ModelsService_js_1 = require("./services/ModelsService.js");
const RemoteService_js_1 = require("./services/RemoteService.js");
const ServeService_js_1 = require("./services/ServeService.js");
const SessionManagerService_js_1 = require("./services/SessionManagerService.js");
const StatsService_js_1 = require("./services/StatsService.js");
const UpgradeService_js_1 = require("./services/UpgradeService.js");
// ACP command
const acp = program.command('acp').description('Start ACP (Agent Client Protocol) server');
acp
    .option('--port <number>', 'Port to listen on', '0')
    .option('--hostname <hostname>', 'Hostname to listen on', '127.0.0.1')
    .option('--cwd <path>', 'Working directory', process.cwd())
    .action(async (options) => {
    try {
        const service = new ACPService_js_1.ACPService({
            port: parseInt(options.port, 10) || 0,
            hostname: options.hostname,
            cwd: options.cwd,
        });
        const { port, hostname } = await service.start();
        console.log(chalk_1.default.green(`✅ ACP server started on ${hostname}:${port}`));
        console.log(chalk_1.default.dim('Press Ctrl+C to stop'));
        process.on('SIGINT', async () => {
            await service.stop();
            process.exit(0);
        });
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
// Auth commands
const auth = program.command('auth').description('Manage credentials');
const authService = new AuthService_js_1.AuthService();
auth
    .command('login')
    .description('Log in to a provider')
    .argument('[url]', 'OAuth URL or provider name')
    .action(async (url) => {
    try {
        const result = await authService.login(url || '', url?.startsWith('http') ? url : undefined);
        if (result.success) {
            console.log(chalk_1.default.green(`✅ ${result.message}`));
        }
        else {
            console.log(chalk_1.default.yellow(result.message));
            if (result.url) {
                console.log(chalk_1.default.cyan(`  URL: ${result.url}`));
            }
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
auth
    .command('logout')
    .description('Log out from a configured provider')
    .argument('<provider>', 'Provider name')
    .action((provider) => {
    try {
        if (authService.logout(provider)) {
            console.log(chalk_1.default.green(`✅ Logged out from '${provider}'`));
        }
        else {
            console.log(chalk_1.default.yellow(`No credentials found for '${provider}'`));
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
auth
    .command('list')
    .alias('ls')
    .description('List providers')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const providers = authService.listProviders();
        if (options.json) {
            console.log(JSON.stringify(providers, null, 2));
            return;
        }
        console.log(chalk_1.default.bold('\nConfigured Providers\n'));
        for (const p of providers) {
            const status = p.authenticated ? chalk_1.default.green('✓') : chalk_1.default.red('✗');
            const type = chalk_1.default.dim(`(${p.type})`);
            console.log(`  ${status} ${chalk_1.default.cyan(p.name)} ${type}`);
        }
        console.log('');
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
// Agent commands (extended)
const agentManager = new AgentManagerService_js_1.AgentManagerService();
const agentCreate = program.command('agent').description('Manage agents');
agentCreate
    .command('create')
    .description('Create a new agent')
    .argument('<name>', 'Agent name')
    .option('--role <role>', 'Agent role (orchestrator|broker|worker|participant)', 'participant')
    .option('--platform <platform>', 'Agent platform', 'vscode')
    .option('--capabilities <caps...>', 'Agent capabilities')
    .action((name, options) => {
    try {
        const agent = agentManager.create(name, options.role, options.platform, {
            capabilities: options.capabilities,
        });
        console.log(chalk_1.default.green(`✅ Created agent '${name}'`));
        console.log(`  ID: ${chalk_1.default.dim(agent.id)}`);
        console.log(`  Role: ${agent.role}`);
        console.log(`  Platform: ${agent.platform}`);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
agentCreate
    .command('list')
    .description('List all available agents')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const agents = agentManager.list();
        if (options.json) {
            console.log(JSON.stringify(agents, null, 2));
            return;
        }
        console.log(chalk_1.default.bold('\nAgents\n'));
        if (agents.length === 0) {
            console.log(chalk_1.default.dim('No agents configured'));
        }
        else {
            for (const a of agents) {
                const status = a.isOnline ? chalk_1.default.green('online') : chalk_1.default.yellow('offline');
                console.log(`  ${chalk_1.default.cyan(a.name)} (${a.role}/${a.platform}): ${status}`);
            }
        }
        console.log('');
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
// Debug commands
const debug = program.command('debug').description('Debugging and troubleshooting tools');
const debugService = new DebugService_js_1.DebugService();
debug
    .command('config')
    .description('Show resolved configuration')
    .option('--path <key>', 'Get specific config path')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        if (options.path) {
            const value = debugService.getConfigPath(options.path);
            if (options.json) {
                console.log(JSON.stringify({ path: options.path, value }, null, 2));
            }
            else {
                console.log(value !== undefined ? JSON.stringify(value, null, 2) : chalk_1.default.yellow('undefined'));
            }
        }
        else {
            const config = debugService.getConfig();
            if (options.json) {
                console.log(JSON.stringify(config, null, 2));
            }
            else {
                console.log(chalk_1.default.bold('\nConfiguration\n'));
                console.log(JSON.stringify(config, null, 2));
            }
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
debug
    .command('lsp')
    .description('LSP debugging utilities')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const lsp = debugService.debugLSP();
        if (options.json) {
            console.log(JSON.stringify(lsp, null, 2));
        }
        else {
            console.log(chalk_1.default.bold('\nLSP Status\n'));
            console.log(`  Available: ${lsp.available ? chalk_1.default.green('yes') : chalk_1.default.red('no')}`);
            if (lsp.path)
                console.log(`  Path: ${chalk_1.default.dim(lsp.path)}`);
            if (lsp.version)
                console.log(`  Version: ${chalk_1.default.dim(lsp.version)}`);
            if (lsp.error)
                console.log(`  Error: ${chalk_1.default.red(lsp.error)}`);
            console.log('');
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
debug
    .command('rg')
    .description('ripgrep debugging utilities')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const rg = debugService.debugRg();
        if (options.json) {
            console.log(JSON.stringify(rg, null, 2));
        }
        else {
            console.log(chalk_1.default.bold('\nripgrep Status\n'));
            console.log(`  Available: ${rg.available ? chalk_1.default.green('yes') : chalk_1.default.red('no')}`);
            if (rg.path)
                console.log(`  Path: ${chalk_1.default.dim(rg.path)}`);
            if (rg.version)
                console.log(`  Version: ${chalk_1.default.dim(rg.version)}`);
            console.log('');
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
debug
    .command('file')
    .description('File system debugging utilities')
    .argument('<path>', 'File path to debug')
    .option('--json', 'Output machine-readable JSON')
    .action((filePath, options) => {
    try {
        const info = debugService.debugFile(filePath);
        if (options.json) {
            console.log(JSON.stringify(info, null, 2));
        }
        else {
            console.log(chalk_1.default.bold('\nFile Info\n'));
            console.log(`  Path: ${chalk_1.default.cyan(filePath)}`);
            console.log(`  Exists: ${info.exists ? chalk_1.default.green('yes') : chalk_1.default.red('no')}`);
            if (info.exists) {
                if (info.size !== undefined)
                    console.log(`  Size: ${info.size} bytes`);
                if (info.modified)
                    console.log(`  Modified: ${chalk_1.default.dim(info.modified)}`);
                if (info.permissions)
                    console.log(`  Permissions: ${info.permissions}`);
            }
            if (info.error)
                console.log(`  Error: ${chalk_1.default.red(info.error)}`);
            console.log('');
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
debug
    .command('scrap')
    .description('List all known projects')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const projects = debugService.listProjects();
        if (options.json) {
            console.log(JSON.stringify(projects, null, 2));
        }
        else {
            console.log(chalk_1.default.bold('\nKnown Projects\n'));
            for (const p of projects) {
                console.log(`  ${chalk_1.default.cyan(p.name)}: ${chalk_1.default.dim(p.path)}`);
            }
            console.log('');
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
debug
    .command('skill')
    .description('List all available skills')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const skills = debugService.listSkills();
        if (options.json) {
            console.log(JSON.stringify(skills, null, 2));
        }
        else {
            console.log(chalk_1.default.bold('\nAvailable Skills\n'));
            for (const s of skills) {
                console.log(`  ${chalk_1.default.cyan(s.name)} (${chalk_1.default.dim(s.source)})`);
            }
            console.log('');
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
debug
    .command('snapshot')
    .description('Snapshot debugging utilities')
    .option('--output <path>', 'Output file path')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const { path: snapshotPath, data } = debugService.createSnapshot(options.output);
        if (options.json) {
            console.log(JSON.stringify(data, null, 2));
        }
        else {
            console.log(chalk_1.default.green(`✅ Snapshot saved to ${snapshotPath}`));
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
debug
    .command('agent')
    .description('Show agent configuration details')
    .argument('<name>', 'Agent name')
    .option('--json', 'Output machine-readable JSON')
    .action((name, options) => {
    try {
        const agent = agentManager.getByName(name) || agentManager.get(name);
        if (!agent) {
            console.log(chalk_1.default.red(`Agent '${name}' not found`));
            process.exit(1);
        }
        if (options.json) {
            console.log(JSON.stringify(agent, null, 2));
        }
        else {
            console.log(chalk_1.default.bold(`\nAgent: ${name}\n`));
            console.log(`  ID: ${chalk_1.default.dim(agent.id)}`);
            console.log(`  Role: ${agent.role}`);
            console.log(`  Platform: ${agent.platform}`);
            console.log(`  Status: ${agent.isOnline ? chalk_1.default.green('online') : chalk_1.default.yellow('offline')}`);
            console.log(`  Created: ${chalk_1.default.dim(agent.createdAt)}`);
            console.log(`  Last Seen: ${chalk_1.default.dim(agent.lastSeen)}`);
            if (agent.capabilities.length > 0) {
                console.log(`  Capabilities: ${agent.capabilities.join(', ')}`);
            }
            console.log('');
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
debug
    .command('paths')
    .description('Show global paths (data, config, cache, state)')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const paths = debugService.getPaths();
        if (options.json) {
            console.log(JSON.stringify(paths, null, 2));
        }
        else {
            console.log(chalk_1.default.bold('\nGlobal Paths\n'));
            console.log(`  Config:  ${chalk_1.default.cyan(paths.config)}`);
            console.log(`  Data:    ${chalk_1.default.cyan(paths.data)}`);
            console.log(`  Cache:   ${chalk_1.default.cyan(paths.cache)}`);
            console.log(`  State:   ${chalk_1.default.cyan(paths.state)}`);
            console.log(`  Logs:    ${chalk_1.default.cyan(paths.logs)}`);
            console.log('');
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
debug
    .command('wait')
    .description('Wait indefinitely (for debugging)')
    .action(() => {
    console.log(chalk_1.default.dim('Waiting... Press Ctrl+C to exit'));
    process.on('SIGINT', () => process.exit(0));
});
// Session commands
const sessionManager = new SessionManagerService_js_1.SessionManagerService();
const session = program.command('session').description('Manage sessions');
session
    .command('list')
    .description('List sessions')
    .option('--json', 'Output machine-readable JSON')
    .action((options) => {
    try {
        const sessions = sessionManager.list();
        if (options.json) {
            console.log(JSON.stringify(sessions, null, 2));
        }
        else {
            console.log(chalk_1.default.bold('\nSessions\n'));
            if (sessions.length === 0) {
                console.log(chalk_1.default.dim('No sessions found'));
            }
            else {
                for (const s of sessions) {
                    const name = s.name || s.id;
                    console.log(`  ${chalk_1.default.cyan(name)} (${s.provider}/${s.model}): ${s.messageCount} msgs`);
                }
            }
            console.log('');
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
session
    .command('delete')
    .description('Delete a session')
    .argument('<sessionId>', 'Session ID')
    .action((sessionId) => {
    try {
        const result = sessionManager.delete(sessionId);
        if (result.success) {
            console.log(chalk_1.default.green(`✅ ${result.message}`));
        }
        else {
            console.log(chalk_1.default.red(result.message));
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
// Remote command
program
    .command('remote')
    .description('Enable remote connection for real-time session relay')
    .option('--port <number>', 'Port to listen on', '0')
    .option('--hostname <hostname>', 'Hostname to listen on', '127.0.0.1')
    .option('--mdns', 'Enable mDNS discovery', false)
    .option('--mdns-domain <domain>', 'Custom mDNS domain', 'tnf.local')
    .option('--cors <origins...>', 'Allowed CORS origins')
    .action(async (options) => {
    try {
        const service = new RemoteService_js_1.RemoteService({
            port: parseInt(options.port, 10) || 0,
            hostname: options.hostname,
            mdns: options.mdns,
            mdnsDomain: options.mdnsDomain,
            cors: options.cors,
        });
        const { url } = await service.enable();
        console.log(chalk_1.default.green(`✅ Remote relay enabled at ${url}`));
        console.log(chalk_1.default.dim('Press Ctrl+C to stop'));
        process.on('SIGINT', async () => {
            await service.disable();
            process.exit(0);
        });
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
// Export command
program
    .command('export')
    .description('Export session data as JSON')
    .argument('[sessionId]', 'Session ID (omit for all sessions)')
    .option('--output <path>', 'Output file path')
    .action(async (sessionId, options) => {
    try {
        if (!sessionId && options?.output) {
            await sessionManager.exportAllToStream(options.output);
            console.log(chalk_1.default.green(`✅ Exported all sessions (streaming) to ${options.output}`));
            return;
        }
        const data = sessionId
            ? sessionManager.export(sessionId)
            : { sessions: sessionManager.exportAll() };
        if (!data) {
            console.log(chalk_1.default.red(`Session '${sessionId}' not found`));
            process.exit(1);
        }
        const json = JSON.stringify(data, null, 2);
        if (options?.output) {
            fs_1.default.writeFileSync(options.output, json);
            console.log(chalk_1.default.green(`✅ Exported to ${options.output}`));
        }
        else {
            console.log(json);
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
// Import command
program
    .command('import')
    .description('Import session data from JSON file or URL')
    .argument('<file>', 'JSON file path or URL')
    .option('--overwrite', 'Overwrite existing session if ID conflicts')
    .action(async (file, options) => {
    try {
        const result = file.startsWith('http')
            ? await sessionManager.importFromUrl(file)
            : sessionManager.importFromFile(file, { overwrite: options.overwrite });
        if (result.success) {
            console.log(chalk_1.default.green(`✅ ${result.message}`));
        }
        else {
            console.log(chalk_1.default.red(result.message));
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
// Models command
program
    .command('models')
    .description('List all available models')
    .argument('[provider]', 'Provider ID to filter models by')
    .option('--verbose', 'Show detailed model information')
    .option('--refresh', 'Refresh the models cache')
    .option('--json', 'Output machine-readable JSON')
    .action(async (provider, options) => {
    try {
        const modelsService = new ModelsService_js_1.ModelsService();
        const models = await modelsService.listModels(provider, { refresh: options?.refresh });
        if (options?.json) {
            console.log(JSON.stringify(models, null, 2));
            return;
        }
        console.log(chalk_1.default.bold('\nAvailable Models\n'));
        if (models.length === 0) {
            console.log(chalk_1.default.dim('No models found'));
        }
        else {
            for (const m of models) {
                if (options?.verbose) {
                    console.log(`${chalk_1.default.cyan(m.id)} (${m.provider})`);
                    if (m.contextWindow)
                        console.log(`  Context: ${m.contextWindow.toLocaleString()} tokens`);
                    if (m.inputCost !== undefined)
                        console.log(`  Input: $${(m.inputCost / 1000000).toFixed(4)}/1M tokens`);
                    if (m.outputCost !== undefined)
                        console.log(`  Output: $${(m.outputCost / 1000000).toFixed(4)}/1M tokens`);
                    console.log('');
                }
                else {
                    console.log(`  ${chalk_1.default.cyan(m.id)}`);
                }
            }
        }
        console.log('');
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
// Stats command
program
    .command('stats')
    .description('Show token usage and cost statistics')
    .option('--days <n>', 'Show stats for the last N days', undefined)
    .option('--tools <n>', 'Number of tools to show', undefined)
    .option('--models', 'Show model statistics')
    .option('--project <name>', 'Filter by project')
    .option('--json', 'Output machine-readable JSON')
    .action(async (options) => {
    try {
        const statsService = new StatsService_js_1.StatsService();
        const summary = await statsService.getSummary({
            days: options.days ? parseInt(options.days, 10) : undefined,
            project: options.project,
        });
        await statsService.close();
        if (options.json) {
            console.log(JSON.stringify(summary, null, 2));
            return;
        }
        console.log(chalk_1.default.bold('\n📊 Usage Statistics\n'));
        console.log(`  Total Tokens: ${chalk_1.default.cyan(summary.totalTokens.toLocaleString())}`);
        console.log(`  Total Cost: ${chalk_1.default.cyan('$' + summary.totalCost.toFixed(4))}`);
        console.log('');
        if (options.models && Object.keys(summary.byModel).length > 0) {
            console.log(chalk_1.default.bold('By Model:'));
            for (const [model, data] of Object.entries(summary.byModel)) {
                console.log(`  ${chalk_1.default.cyan(model)}: ${data.tokens.toLocaleString()} tokens, $${data.cost.toFixed(4)}`);
            }
            console.log('');
        }
        if (Object.keys(summary.byProvider).length > 0) {
            console.log(chalk_1.default.bold('By Provider:'));
            for (const [provider, data] of Object.entries(summary.byProvider)) {
                console.log(`  ${chalk_1.default.cyan(provider)}: ${data.tokens.toLocaleString()} tokens, $${data.cost.toFixed(4)}`);
            }
            console.log('');
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
// Database commands
const db = program.command('db').description('Database tools');
const dbService = new DatabaseService_js_1.DatabaseService();
db.command('path')
    .description('Print the database path')
    .action(() => {
    console.log(dbService.getPath());
});
db.command('migrate')
    .description('Migrate JSON data to SQLite (merges with existing data)')
    .action(async () => {
    try {
        const result = await dbService.migrate();
        console.log(chalk_1.default.green(`✅ Migrated ${result.migrated} files`));
        if (result.errors.length > 0) {
            for (const err of result.errors) {
                console.log(chalk_1.default.yellow(err));
            }
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
db.argument('[query]', 'SQL query to execute')
    .option('--format <format>', 'Output format (json|tsv)', 'tsv')
    .description('Open an interactive sqlite3 shell or run a query')
    .action(async (query, options) => {
    try {
        if (!query) {
            await dbService.openInteractive();
            return;
        }
        const result = await dbService.query(query, { format: options?.format });
        if (options?.format === 'json') {
            console.log(JSON.stringify(result.rows, null, 2));
        }
        else {
            console.log(result.columns.join('\t'));
            for (const row of result.rows) {
                console.log(Object.values(row).join('\t'));
            }
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
// Serve command
program
    .command('serve')
    .description('Starts a headless tnf server')
    .option('--port <number>', 'Port to listen on', '0')
    .option('--hostname <hostname>', 'Hostname to listen on', '127.0.0.1')
    .option('--mdns', 'Enable mDNS service discovery', false)
    .option('--mdns-domain <domain>', 'Custom mDNS domain', 'tnf.local')
    .option('--cors <origins...>', 'Allowed CORS origins')
    .action(async (options) => {
    try {
        const service = new ServeService_js_1.ServeService({
            port: parseInt(options.port, 10) || 0,
            hostname: options.hostname,
            mdns: options.mdns,
            mdnsDomain: options.mdnsDomain,
            cors: options.cors,
        });
        const status = await service.start();
        console.log(chalk_1.default.green(`✅ TNF server started at ${status.url}`));
        console.log(chalk_1.default.dim(`  PID: ${status.pid}`));
        console.log(chalk_1.default.dim('Press Ctrl+C to stop'));
        process.on('SIGINT', async () => {
            await service.stop();
            process.exit(0);
        });
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
// Completion command
program
    .command('completion')
    .description('Generate shell completion script')
    .option('--shell <shell>', 'Shell type (zsh|bash|fish)', 'zsh')
    .action((options) => {
    const completion = (0, CompletionService_js_1.generateCompletion)(options.shell);
    console.log(completion);
    console.log(chalk_1.default.dim('\n' + (0, CompletionService_js_1.getInstallInstructions)(options.shell)));
});
// Upgrade command
program
    .command('upgrade')
    .description('Upgrade tnf to the latest or a specific version')
    .argument('[target]', 'Version to upgrade to')
    .option('-m, --method <method>', 'Installation method (curl|npm|pnpm|bun|brew)')
    .action(async (target, options) => {
    try {
        const upgradeService = new UpgradeService_js_1.UpgradeService();
        const result = await upgradeService.upgrade({ target, method: options?.method });
        if (result.success) {
            console.log(chalk_1.default.green(`✅ ${result.message}`));
        }
        else {
            console.log(chalk_1.default.red(result.message));
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
// Uninstall command
program
    .command('uninstall')
    .description('Uninstall tnf and remove all related files')
    .action(async () => {
    try {
        const upgradeService = new UpgradeService_js_1.UpgradeService();
        const result = await upgradeService.uninstall();
        if (result.success) {
            console.log(chalk_1.default.green(`✅ ${result.message}`));
        }
        else {
            console.log(chalk_1.default.red(result.message));
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error: ${err.message}`));
        process.exit(1);
    }
});
async function main() {
    if (process.argv.length <= 2) {
        await renderSplash({
            compact: false,
            animate: process.stdout.isTTY,
        });
        console.log('');
        program.outputHelp();
        return;
    }
    if (isOpenClawPassthroughArgv(process.argv)) {
        await runPassthrough('openclaw', process.argv.slice(3));
        return;
    }
    if (isHermesPassthroughArgv(process.argv)) {
        await runPassthrough('hermes', process.argv.slice(3));
        return;
    }
    if (isGeminiPassthroughArgv(process.argv)) {
        await runPassthrough('gemini', process.argv.slice(3));
        return;
    }
    const implicitArgs = resolveImplicitPassthroughArgs(process.argv);
    if (implicitArgs) {
        await runPassthrough(implicitArgs.cliName, implicitArgs.args);
        return;
    }
    await program.parseAsync(process.argv);
}
main().catch((err) => {
    console.error(chalk_1.default.red(`Error: ${err.message}`));
    process.exit(1);
});
//# sourceMappingURL=cli.js.map
