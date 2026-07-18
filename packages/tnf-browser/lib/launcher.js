const { spawn, execSync } = require('child_process');
const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');
const RUNTIME_DIR = path.join(os.homedir(), 'tnf-browser');
const BROWSER_STATE_FILE = path.join(RUNTIME_DIR, 'browser-process.json');

function normalizeProfilePath(profilePath) {
  return profilePath ? String(profilePath).replace(/^~/, os.homedir()) : profilePath;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function formatWarn(message) {
  return `\x1b[33m[WARN]\x1b[0m ${message}`;
}

function displayFromXauthLine(line) {
  const match = String(line || "").match(/\S+(?:\/unix)?:(\d+)\s+/);
  return match ? `:${match[1]}` : null;
}

function defaultListXauthority(authPath) {
  try {
    return execSync(`xauth -f ${shellQuote(authPath)} list`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

function resolveBrowserDisplayEnv(options = {}) {
  const env = { ...(options.env || process.env) };
  const platform = options.platform || process.platform;
  const homeDir = options.homeDir || os.homedir();
  const existsSync = options.existsSync || fs.existsSync;
  const listXauthority = options.listXauthority || defaultListXauthority;

  if (platform !== 'linux') {
    return { env, inferred: false, warning: null };
  }

  if (env.DISPLAY) {
    return { env, inferred: false, warning: null };
  }

  const authPath = env.XAUTHORITY || path.join(homeDir, '.Xauthority');
  if (authPath && existsSync(authPath)) {
    const lines = listXauthority(authPath);
    for (const line of lines) {
      const display = displayFromXauthLine(line);
      if (!display) continue;
      env.DISPLAY = display;
      env.XAUTHORITY = authPath;
      return {
        env,
        inferred: true,
        warning:
          `No DISPLAY was set; using detected desktop display DISPLAY=${display} ` +
          `XAUTHORITY=${authPath}. This launches normal Chromium, not headless mode.`,
      };
    }
  }

  return {
    env,
    inferred: false,
    warning:
      'No DISPLAY is set. TNF Browser needs a real desktop display; start it from XFCE ' +
      'or export DISPLAY and XAUTHORITY before launching.',
  };
}

// Kill only browser instances that are using this framework's profile.
// Never kill by browser name alone: that can terminate the user's normal session.
function killBrowserForProfile(profilePath) {
  if (!profilePath || process.platform === 'win32') return;
  profilePath = normalizeProfilePath(profilePath);
  try {
    execSync(`pkill -f -- "--user-data-dir=${profilePath}" 2>/dev/null || true`, {
      stdio: 'ignore',
    });
    execSync('sleep 2', { stdio: 'ignore' });
  } catch {}
}

function killBrowserByBinary(browserPath) {
  if (!browserPath || process.platform === 'win32') return;
  const normalized = String(browserPath);
  const binaryName = path.basename(normalized);
  try {
    execSync(`pkill -x -- ${shellQuote(binaryName)} 2>/dev/null || true`, {
      stdio: 'ignore',
    });
  } catch {}
  try {
    execSync(`pkill -f -- ${shellQuote(normalized)} 2>/dev/null || true`, {
      stdio: 'ignore',
    });
  } catch {}
  sleepSeconds(2);
}

function sleepSeconds(sec) {
  try {
    execSync(`sleep ${sec}`, { stdio: 'ignore' });
  } catch {}
}

function readBrowserState() {
  try {
    return JSON.parse(fs.readFileSync(BROWSER_STATE_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function writeBrowserState(state) {
  try {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    fs.writeFileSync(BROWSER_STATE_FILE, JSON.stringify(state, null, 2));
  } catch {}
}

function clearBrowserState() {
  try { fs.unlinkSync(BROWSER_STATE_FILE); } catch {}
}

function processExists(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function getProcessCommandLine(pid) {
  try {
    if (process.platform === 'win32') {
      return execSync(
        `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \\"ProcessId=${pid}\\").CommandLine"`,
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      ).trim();
    }
    return execSync(`ps -p ${pid} -o command=`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function pidMatchesProfile(pid, profilePath) {
  profilePath = normalizeProfilePath(profilePath);
  if (!pid || !profilePath || !processExists(pid)) return false;
  const cmd = getProcessCommandLine(pid);
  return !!cmd && cmd.includes(`--user-data-dir=${profilePath}`);
}

function terminateManagedPid(pid) {
  if (!pid || !processExists(pid)) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
      return;
    }
    process.kill(-pid, 'SIGTERM');
  } catch {
    try { process.kill(pid, 'SIGTERM'); } catch {}
  }
  sleepSeconds(2);
  if (!processExists(pid)) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {
    try { process.kill(pid, 'SIGKILL'); } catch {}
  }
  sleepSeconds(1);
}

function stopManagedBrowser(profilePath, options = {}) {
  profilePath = normalizeProfilePath(profilePath);
  const fallbackToProfileMatch = options.fallbackToProfileMatch !== false;
  const state = readBrowserState();

  if (state?.pid && state.profile === profilePath && pidMatchesProfile(state.pid, profilePath)) {
    terminateManagedPid(state.pid);
  }

  clearBrowserState();

  if (fallbackToProfileMatch) {
    killBrowserForProfile(profilePath);
  }
}

function maybeKillManagedBrowser(profilePath, config = {}) {
  const cleanupConfig = config.framework?.processCleanup || {};
  const fallbackToProfileMatch = cleanupConfig.fallbackToProfileMatch === true;
  stopManagedBrowser(profilePath, {
    fallbackToProfileMatch,
  });
}

// Chrome derives unpacked extension IDs from the absolute path:
// SHA-256 hash → first 32 hex chars → each hex digit mapped to a-p
function computeExtensionId(extensionAbsPath) {
  const hash = crypto.createHash('sha256').update(extensionAbsPath).digest('hex');
  return hash.slice(0, 32).split('').map(c =>
    String.fromCharCode('a'.charCodeAt(0) + parseInt(c, 16))
  ).join('');
}

// Browser mode registry. Each mode knows whether its binary accepts the
// `--load-extension` CLI flag. Branded Google Chrome blocks it
// ("--load-extension is not allowed in Google Chrome, ignoring."), so those
// modes must seed the extension on disk instead. The system detects the
// running binary, records the resolved mode, and holds it across restarts.
const BROWSER_MODES = {
  chromium: {
    label: 'Chromium',
    patterns: [/chromium/i],
    supportsLoadExtensionFlag: true,
  },
  chrome: {
    label: 'Google Chrome',
    patterns: [/google chrome/i, /\/chrome$/i, /\/chrome\.app\//i],
    supportsLoadExtensionFlag: false,
  },
  brave: {
    label: 'Brave',
    patterns: [/brave/i],
    supportsLoadExtensionFlag: true,
  },
  edge: {
    label: 'Microsoft Edge',
    patterns: [/microsoft edge/i, /\bedge\b/i],
    supportsLoadExtensionFlag: true,
  },
  vivaldi: {
    label: 'Vivaldi',
    patterns: [/vivaldi/i],
    supportsLoadExtensionFlag: true,
  },
  helium: {
    label: 'Helium',
    patterns: [/helium/i],
    supportsLoadExtensionFlag: true,
  },
  arc: {
    label: 'Arc',
    patterns: [/arc/i],
    supportsLoadExtensionFlag: true,
  },
  opera: {
    label: 'Opera',
    patterns: [/opera/i],
    supportsLoadExtensionFlag: true,
  },
  unknown: {
    label: 'Unknown Chromium-based browser',
    patterns: [],
    supportsLoadExtensionFlag: true,
  },
};

function detectBrowserMode(browserPath) {
  const key = String(browserPath || '');
  for (const [mode, def] of Object.entries(BROWSER_MODES)) {
    if (mode === 'unknown') continue;
    if (def.patterns.some((re) => re.test(key))) {
      return { mode, ...def };
    }
  }
  return { mode: 'unknown', ...BROWSER_MODES.unknown };
}

// Hold the resolved browser mode across restarts. The mode is cached in the
// browser-process state file so a later `start` reuses the same strategy
// without re-probing the binary (which is slow and can change between runs).
function readResolvedMode() {
  const state = readBrowserState();
  return state && state.browserMode ? state.browserMode : null;
}

function writeResolvedMode(browserPath) {
  const detected = detectBrowserMode(browserPath);
  const state = readBrowserState() || {};
  state.browserMode = detected;
  writeBrowserState(state);
  return detected;
}

function resolveBrowserMode(browserPath, options = {}) {
  if (!options.force) {
    const cached = readResolvedMode();
    if (cached && cached.mode) return cached;
  }
  return writeResolvedMode(browserPath);
}

// Known install locations per platform. Used to auto-discover a browser that
// supports the `--load-extension` flag when the user's configured browser
// (e.g. branded Google Chrome) blocks it. Browsers are listed most-preferred
// first.
const BROWSER_SEARCH_PATHS = {
  darwin: [
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Vivaldi.app/Contents/MacOS/Vivaldi',
    '/Applications/Helium.app/Contents/MacOS/Helium',
    '/Applications/Arc.app/Contents/MacOS/Arc',
    '/Applications/Opera.app/Contents/MacOS/Opera',
  ],
  linux: [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/usr/bin/brave',
    '/usr/bin/brave-browser',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/microsoft-edge',
    '/usr/bin/edge',
  ],
  win32: [
    'C:\\Program Files\\Chromium\\Application\\chrome.exe',
    'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
};

// Find an installed flag-supported browser. Returns { path, mode } or null.
function discoverFlagSupportedBrowser(options = {}) {
  const platform = options.platform || process.platform;
  const existsSync = options.existsSync || fs.existsSync;
  const candidates = BROWSER_SEARCH_PATHS[platform] || [];
  const preferred = options.preferPath;
  if (preferred && existsSync(preferred)) {
    const m = detectBrowserMode(preferred);
    if (m.supportsLoadExtensionFlag) return { path: preferred, mode: m };
  }
  for (const p of candidates) {
    if (existsSync(p)) {
      const m = detectBrowserMode(p);
      if (m.supportsLoadExtensionFlag) return { path: p, mode: m };
    }
  }
  return null;
}

// Seed an unpacked extension into the profile the same way `--load-extension`
// would, so browsers that block the CLI flag (branded Google Chrome) still
// load it. Writes the extension files under Default/Extensions/<id>/<ver>_
// and registers it in Local State. Used only when the mode does not support
// the `--load-extension` flag.
function seedExtensionIntoProfile(profilePath, extensionPath) {
  const defaultDir = path.join(profilePath, 'Default');
  fs.mkdirSync(defaultDir, { recursive: true });

  const extAbs = path.resolve(extensionPath);
  const manifest = JSON.parse(
    fs.readFileSync(path.join(extAbs, 'manifest.json'), 'utf8'),
  );
  const version = String(manifest.version || '1.0.0');
  const extId = computeExtensionId(extAbs);
  const dest = path.join(defaultDir, 'Extensions', extId, `${version}_`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.rmSync(dest, { recursive: true, force: true });
  copyDir(extAbs, dest);

  const localStatePath = path.join(profilePath, 'Local State');
  let state = {};
  if (fs.existsSync(localStatePath)) {
    try {
      state = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
    } catch {}
  }
  state.extensions = state.extensions || {};
  state.extensions.settings = state.extensions.settings || {};
  state.extensions.settings[extId] = {
    account_extension_type: 'LOCAL',
    creation_flags: 1,
    from_webstore: false,
    installed_by_custodian: false,
    manifest,
    path: `Default/Extensions/${extId}/${version}_`,
    location: 1,
    state: 1,
    version,
    was_installed_by_default: false,
    was_installed_by_oem: false,
    install_time: '13300000000000000',
  };
  fs.writeFileSync(localStatePath, JSON.stringify(state));

  // Chrome only starts an extension's service worker (and thus the runtime
  // handshake) once it is registered AND enabled in the profile Preferences,
  // not just Local State. Mirror the entry into Default/Preferences so the
  // seeded extension is enabled and its SW actually runs.
  const prefsPath = path.join(defaultDir, 'Preferences');
  let prefs = {};
  if (fs.existsSync(prefsPath)) {
    try {
      prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
    } catch {}
  }
  prefs.extensions = prefs.extensions || {};
  prefs.extensions.settings = prefs.extensions.settings || {};
  prefs.extensions.settings[extId] = {
    account_extension_type: 'LOCAL',
    creation_flags: 1,
    from_webstore: false,
    installed_by_custodian: false,
    manifest,
    path: `Default/Extensions/${extId}/${version}_`,
    location: 1,
    state: 1,
    version,
    was_installed_by_default: false,
    was_installed_by_oem: false,
    install_time: '13300000000000000',
    acknowledged_external_extension_loaded: true,
  };
  if (!Array.isArray(prefs.extensions.pinned_extensions)) {
    prefs.extensions.pinned_extensions = [];
  }
  if (!prefs.extensions.pinned_extensions.includes(extId)) {
    prefs.extensions.pinned_extensions.push(extId);
  }
  fs.writeFileSync(prefsPath, JSON.stringify(prefs));
  return extId;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else if (entry.isFile()) fs.copyFileSync(s, d);
  }
}

function getProfileSeed(config = {}) {
  return config.framework?.profileSeed || {};
}

function writeLocalState(profilePath, seed = {}) {
  const localStatePath = path.join(profilePath, 'Local State');
  let state = {};
  try {
    if (fs.existsSync(localStatePath)) {
      state = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
    }
  } catch {}

  if (!state.profile) state.profile = {};
  if (!state.profile.info_cache) state.profile.info_cache = {};
  if (!state.profile.info_cache.Default) state.profile.info_cache.Default = {};
  const info = state.profile.info_cache.Default;
  info.name = seed.name || 'TNF Browser';
  info.is_using_default_name = false;
  if (!Array.isArray(state.profile.last_active_profiles)) {
    state.profile.last_active_profiles = ['Default'];
  }
  if (!Array.isArray(state.profile.profiles_order)) {
    state.profile.profiles_order = ['Default'];
  }

  fs.writeFileSync(localStatePath, JSON.stringify(state));
}

function applyPreferenceSeed(prefs, extensionId, seed = {}) {
  if (!prefs.extensions) prefs.extensions = {};
  if (!prefs.profile) prefs.profile = {};

  if (seed.pinExtension !== false) {
    const pinned = Array.isArray(prefs.extensions.pinned_extensions)
      ? prefs.extensions.pinned_extensions
      : [];
    if (!pinned.includes(extensionId)) pinned.push(extensionId);
    prefs.extensions.pinned_extensions = pinned;
  }

  // Chrome tracks developer_mode, restore_on_startup, and startup_urls
  // with MAC-signed protection. Setting them externally triggers a tamper
  // reset on next launch — so we don't seed them. The --load-extension
  // flag works independently of the developer_mode UI preference.

  prefs.profile.name = seed.name || prefs.profile.name || 'TNF Browser';
  prefs.profile.exited_cleanly = true;
  prefs.profile.exit_type = 'Normal';
  prefs.exited_cleanly = true;
  prefs.exit_type = 'Normal';
  return prefs;
}

// First run: seed Default/Preferences with pinned extension + clean exit flags
function seedProfile(profilePath, extensionPath, config = {}) {
  const defaultDir = path.join(profilePath, 'Default');
  fs.mkdirSync(defaultDir, { recursive: true });

  const extId = computeExtensionId(path.resolve(extensionPath));
  const prefs = applyPreferenceSeed({}, extId, getProfileSeed(config));
  fs.writeFileSync(path.join(defaultDir, 'Preferences'), JSON.stringify(prefs));
  writeLocalState(profilePath, getProfileSeed(config));
}

// Subsequent runs: delete session files so Chrome doesn't restore old tabs,
// mark profile as cleanly exited to suppress the "restore" bar
function cleanSession(profilePath, extensionPath, config = {}) {
  const defaultDir = path.join(profilePath, 'Default');
  for (const f of ['Current Session', 'Current Tabs', 'Last Session', 'Last Tabs']) {
    try { fs.unlinkSync(path.join(defaultDir, f)); } catch {}
  }
  try {
    const sessionsDir = path.join(defaultDir, 'Sessions');
    if (fs.existsSync(sessionsDir)) {
      for (const name of fs.readdirSync(sessionsDir)) {
        if (/^(Session|Tabs)_/.test(name)) {
          try { fs.unlinkSync(path.join(sessionsDir, name)); } catch {}
        }
      }
    }
  } catch {}

  const prefsPath = path.join(defaultDir, 'Preferences');
  try {
    if (fs.existsSync(prefsPath)) {
      const extId = computeExtensionId(path.resolve(extensionPath));
      const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
      applyPreferenceSeed(prefs, extId, getProfileSeed(config));
      fs.writeFileSync(prefsPath, JSON.stringify(prefs));
    }
  } catch {}
  try {
    writeLocalState(profilePath, getProfileSeed(config));
  } catch {}
}

function launchBrowser(config, extensionPath) {
  const browser = config.browser;
  if (!browser) {
    throw new Error('No browser path configured. Set "browser" in ~/tnf-browser/config.js');
  }
  const browserEnv = resolveBrowserDisplayEnv({ env: process.env });
  if (browserEnv.warning && !config.__displayWarningAlreadyShown) {
    console.log(formatWarn(browserEnv.warning));
  }

  // Expand ~ to home directory
  const profile = normalizeProfilePath(config.profile || '~/tnf-browser/profile');

  // Kill only a previously managed process for this exact automation profile.
  // Profile matching is an optional fallback, not the default strategy.
  maybeKillManagedBrowser(profile, config);

  // Remove stale lock left by a previously force-killed browser instance.
  // Without this, Chromium shows a crash recovery dialog on next launch.
  try { fs.unlinkSync(path.join(profile, 'SingletonLock')); } catch {}

  if (fs.existsSync(path.join(profile, 'Default'))) {
    cleanSession(profile, extensionPath, config);
  } else {
    seedProfile(profile, extensionPath, config);
  }

  // Resolve and hold the browser mode so the correct extension-load strategy
  // is used. Chromium-family browsers accept `--load-extension`; branded
  // Google Chrome blocks it ("--load-extension is not allowed in Google
  // Chrome, ignoring."), so those modes need an alternative strategy.
  let mode = resolveBrowserMode(browser, config.framework?.browserMode || {});
  let effectiveBrowser = browser;

  if (!mode.supportsLoadExtensionFlag) {
    // Best effort: seed the extension on disk so the profile at least carries
    // it. Branded Chrome may still prune the registration on launch, so also
    // try to fall back to an installed flag-supported browser which loads the
    // extension reliably via the CLI flag.
    seedExtensionIntoProfile(profile, extensionPath);
    const alt = discoverFlagSupportedBrowser({ preferPath: config.framework?.preferBrowser });
    if (alt) {
      effectiveBrowser = alt.path;
      mode = alt.mode;
      console.log(
        formatWarn(
          `Configured browser blocks --load-extension (${mode.label}). ` +
          `Falling back to ${alt.mode.label} at ${alt.path} which supports it. ` +
          `Set "browser" in ~/tnf-browser/config.js to make this permanent.`,
        ),
      );
    } else {
      console.log(
        formatWarn(
          `Configured browser (${mode.label}) blocks --load-extension. ` +
          `Seeded the extension on disk as a best effort; if it does not load, ` +
          `open chrome://extensions and use "Load unpacked" on the TNF extension, ` +
          `or set "browser" to Chromium/Brave/Edge/Helium in ~/tnf-browser/config.js.`,
        ),
      );
    }
  }

  try {
    const st = readBrowserState() || {};
    st.browserMode = mode;
    st.configuredBrowser = browser;
    st.effectiveBrowser = effectiveBrowser;
    st.extensionStrategy = mode.supportsLoadExtensionFlag ? 'load-extension-flag' : 'seed-on-disk';
    writeBrowserState(st);
  } catch {}

  const viewport = config.viewport || { width: 1280, height: 900 };
  const startUrl = config.startUrl || 'about:blank';

  const fwDebug = config.framework?.debug || {};
  const debugPort = fwDebug.devtools ? 9222 : null;

  const loadExtensionArg = mode.supportsLoadExtensionFlag
    ? [`--load-extension=${extensionPath}`]
    : [];

  const args = [
    `--user-data-dir=${profile}`,
    ...loadExtensionArg,
    '--disable-fre',
    '--no-default-browser-check',
    '--no-first-run',
    `--window-size=${viewport.width},${viewport.height}`,
    ...(debugPort ? [`--remote-debugging-port=${debugPort}`] : []),
    ...(config.userAgent ? [`--user-agent=${config.userAgent}`] : []),
    ...(config.browserArgs || []),
    startUrl,
  ];

  const child = spawn(effectiveBrowser, args, {
    stdio: 'ignore',
    detached: true,
    env: browserEnv.env,
  });
  const prior = readBrowserState() || {};
  writeBrowserState({
    pid: child.pid,
    profile,
    browser: effectiveBrowser,
    configuredBrowser: browser,
    browserMode: prior.browserMode,
    extensionStrategy: prior.extensionStrategy,
  });
  child.unref();
  return child;
}

module.exports = {
  launchBrowser,
  clearBrowserState,
  killBrowserForProfile,
  killBrowserByBinary,
  stopManagedBrowser,
  normalizeProfilePath,
  resolveBrowserDisplayEnv,
  formatWarn,
  detectBrowserMode,
  resolveBrowserMode,
  discoverFlagSupportedBrowser,
  seedExtensionIntoProfile,
  computeExtensionId,
  BROWSER_MODES,
};
