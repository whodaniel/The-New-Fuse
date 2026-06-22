module.exports = {
  // Path to any Chromium-based binary (Chrome, Chromium, Brave, Edge, etc.)
  browser: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',

  // Where to store the browser profile used by this framework
  profile: process.env.WEBPILOT_PROFILE || require('path').join(__dirname, 'profile'),

  // Local WebSocket bridge port
  port: 7331,

  // First page to open on launch (override via WEBPILOT_START_URL)
  startUrl: process.env.WEBPILOT_START_URL || 'https://hugopalma.work',

  // Browser window size
  viewport: { width: 1920, height: 1080 },

  // Extra Chromium flags
  browserArgs: [],

  // How long to wait for the extension handshake
  connectionTimeout: 120000,

  // Logging: silent | error | info | debug
  logLevel: 'info',

  framework: {
    handles: {
      ttlMs: 15 * 60 * 1000,
      cleanupIntervalMs: 60 * 1000,
    },
    profileSeed: {
      name: 'Webpilot',
      pinExtension: true,
    },
    debug: {
      // Visible on purpose so users can see the cursor path they are configuring
      cursor: true,
    },
  },

  human: {
    // Public defaults are intentionally generic. Tune your own profile.
    calibrated: false,
    profileName: 'public-default',
    cursor: {
      targetInsetRatio: 0.2,
      spreadRatio: 0.16,
      spreadMax: 48,
      cp1MinRatio: 0.2,
      cp1MaxRatio: 0.28,
      cp2MinRatio: 0.66,
      cp2MaxRatio: 0.74,
      cp2SpreadRatio: 0.3,
      minSteps: 10,
      maxSteps: 56,
      stepDivisor: 6,
      jitterRatio: 0,
      jitterMaxPx: 0,
      stutterChance: 0,
      driftThresholdPx: 0,
      driftMinPx: 0,
      driftMaxPx: 0,
      overshootRatio: 0,
      overshootThresholdPx: 240,
      overshootMinDistancePx: 120,
      overshootMaxPx: 0,
      overshootDistanceRatio: 0.04,
      overshootPerpRatio: 0,
      overshootBackSteps: 0,
    },
    avoid: {
      selectors: [],
      classes: [],
      ids: [],
      attributes: {},
    },
    click: {
      thinkDelayMin: 35,
      thinkDelayMax: 90,
      maxShiftPx: 50,
      minVisibleRatio: 0.75,
      comfortTopRatio: 0.18,
      comfortBottomRatio: 0.82,
      comfortLeftRatio: 0.06,
      comfortRightRatio: 0.94,
      shiftCorrectionMax: 1,
      stableRectSamples: 3,
      stableRectIntervalMs: 80,
      stableRectTolerancePx: 2,
      stableRectTimeoutMs: 900,
    },
    type: {
      baseDelayMin: 8,
      baseDelayMax: 20,
      variance: 4,
      pauseChance: 0,
      pauseMin: 0,
      pauseMax: 0,
    },
    scroll: {
      amountMin: 180,
      amountMax: 320,
      backScrollChance: 0.03,
      backScrollMin: 8,
      backScrollMax: 24,
    },
  },
};
