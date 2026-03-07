/**
 * Terminal Formatter for TNF Relay Server
 *
 * Provides structured, colorized console output for relay events.
 * Inspired by the Fuse Connect landing page's terminal demo aesthetic.
 *
 * All functions are pure formatters — they return formatted strings
 * and write to stdout. They do NOT mutate state.
 */

// ─── ANSI Escape Codes ──────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Bright foreground
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Background
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────

function ts(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function padRight(text: string, len: number): string {
  return text.length >= len ? text : text + ' '.repeat(len - text.length);
}

// ─── Public API ──────────────────────────────────────────────────────

export const relay = {
  /**
   * Print the enhanced startup banner.
   * Call this INSTEAD OF the existing box-drawing banner in `start()`.
   */
  banner(opts: {
    port: number;
    redisBridge: boolean;
    activityPersistence: boolean;
    stallDetection: boolean;
    jwtAuth: boolean;
  }): void {
    const { port, redisBridge, activityPersistence, stallDetection, jwtAuth } = opts;
    const check = `${c.green}✓${c.reset}`;
    const cross = `${c.dim}✗${c.reset}`;

    const features = [
      `Stall Detection    ${stallDetection ? check : cross}`,
      `Auto-Recovery      ${stallDetection ? check : cross}`,
      `Redis Bridge       ${redisBridge ? check : cross}`,
      `Activity Stream    ${activityPersistence ? check : cross}`,
      `JWT Authentication ${jwtAuth ? check : cross}`,
    ];

    const lines = [
      '',
      `${c.cyan}${c.bold}  ╔════════════════════════════════════════════════════════════════╗${c.reset}`,
      `${c.cyan}${c.bold}  ║${c.reset}                                                                ${c.cyan}${c.bold}║${c.reset}`,
      `${c.cyan}${c.bold}  ║${c.reset}   ${c.brightCyan}${c.bold}⚡  T N F   R E L A Y   S E R V E R${c.reset}                          ${c.cyan}${c.bold}║${c.reset}`,
      `${c.cyan}${c.bold}  ║${c.reset}   ${c.dim}Part of @the-new-fuse/relay-core${c.reset}                            ${c.cyan}${c.bold}║${c.reset}`,
      `${c.cyan}${c.bold}  ║${c.reset}                                                                ${c.cyan}${c.bold}║${c.reset}`,
      `${c.cyan}${c.bold}  ╠════════════════════════════════════════════════════════════════╣${c.reset}`,
      `${c.cyan}${c.bold}  ║${c.reset}                                                                ${c.cyan}${c.bold}║${c.reset}`,
      `${c.cyan}${c.bold}  ║${c.reset}   ${c.white}WebSocket${c.reset}  ${c.brightCyan}ws://localhost:${port}/ws${c.reset}${' '.repeat(Math.max(0, 27 - String(port).length))}${c.cyan}${c.bold}║${c.reset}`,
      `${c.cyan}${c.bold}  ║${c.reset}   ${c.white}Health${c.reset}     ${c.dim}http://localhost:${port}/health${c.reset}${' '.repeat(Math.max(0, 23 - String(port).length))}${c.cyan}${c.bold}║${c.reset}`,
      `${c.cyan}${c.bold}  ║${c.reset}   ${c.white}Agents${c.reset}     ${c.dim}http://localhost:${port}/agents${c.reset}${' '.repeat(Math.max(0, 23 - String(port).length))}${c.cyan}${c.bold}║${c.reset}`,
      `${c.cyan}${c.bold}  ║${c.reset}   ${c.white}Channels${c.reset}   ${c.dim}http://localhost:${port}/channels${c.reset}${' '.repeat(Math.max(0, 21 - String(port).length))}${c.cyan}${c.bold}║${c.reset}`,
      `${c.cyan}${c.bold}  ║${c.reset}   ${c.white}Activity${c.reset}   ${c.dim}http://localhost:${port}/activity/recent${c.reset}${' '.repeat(Math.max(0, 14 - String(port).length))}${c.cyan}${c.bold}║${c.reset}`,
      `${c.cyan}${c.bold}  ║${c.reset}                                                                ${c.cyan}${c.bold}║${c.reset}`,
      `${c.cyan}${c.bold}  ╠════════════════════════════════════════════════════════════════╣${c.reset}`,
      `${c.cyan}${c.bold}  ║${c.reset}                                                                ${c.cyan}${c.bold}║${c.reset}`,
      ...features.map(
        (f) =>
          `${c.cyan}${c.bold}  ║${c.reset}   ${f}${' '.repeat(Math.max(0, 50))}${c.cyan}${c.bold}║${c.reset}`
      ),
      `${c.cyan}${c.bold}  ║${c.reset}                                                                ${c.cyan}${c.bold}║${c.reset}`,
      `${c.cyan}${c.bold}  ╚════════════════════════════════════════════════════════════════╝${c.reset}`,
      '',
    ];

    lines.forEach((l) => process.stdout.write(l + '\n'));
  },

  // ── Agent Events ─────────────────────────────────────────────────

  agentRegistered(name: string, id: string, platform: string, authenticated: boolean): void {
    const authBadge = authenticated ? ` ${c.green}[JWT ✓]${c.reset}` : '';
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.green}[*]${c.reset} Agent registered: ${c.bold}${name}${c.reset} ${c.dim}(${id})${c.reset} ${c.magenta}${platform}${c.reset}${authBadge}`
    );
  },

  agentDisconnected(agentId: string): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.yellow}[*]${c.reset} Agent disconnected: ${c.dim}${agentId}${c.reset}`
    );
  },

  agentTimeout(agentId: string): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.red}[!]${c.reset} Agent timeout: ${c.red}${agentId}${c.reset}`
    );
  },

  // ── Connection Events ────────────────────────────────────────────

  newConnection(remoteAddress: string | undefined): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.cyan}[>]${c.reset} New connection from ${c.cyan}${remoteAddress || 'unknown'}${c.reset}`
    );
  },

  // ── Channel Events ───────────────────────────────────────────────

  channelCreated(name: string, id: string, createdBy: string): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.blue}[+]${c.reset} Channel created: ${c.bold}${name}${c.reset} ${c.dim}(${id})${c.reset} by ${createdBy}`
    );
  },

  channelJoined(name: string, channelId: string): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.blue}[*]${c.reset} Channel joined: ${c.blue}${name || channelId}${c.reset}`
    );
  },

  channelDeleted(channelId: string): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.yellow}[-]${c.reset} Channel deleted: ${c.dim}${channelId}${c.reset}`
    );
  },

  channelPaused(channelId: string): void {
    console.log(`${c.dim}${ts()}${c.reset} ${c.yellow}[⏸]${c.reset} Channel paused: ${channelId}`);
  },

  channelResumed(channelId: string): void {
    console.log(`${c.dim}${ts()}${c.reset} ${c.green}[▶]${c.reset} Channel resumed: ${channelId}`);
  },

  // ── Message Events ───────────────────────────────────────────────

  messageRouted(type: string, from: string, to?: string, channel?: string): void {
    const dest = to
      ? `→ ${c.white}${to}${c.reset}`
      : channel
        ? `#${c.blue}${channel}${c.reset}`
        : 'broadcast';
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.magenta}[⇄]${c.reset} ${padRight(type, 18)} ${c.dim}from${c.reset} ${c.white}${from}${c.reset} ${dest}`
    );
  },

  // ── Protocol Events ──────────────────────────────────────────────

  protocolMessage(type: string, agentId: string | null): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.dim}[·]${c.reset} ${type} from ${agentId || 'unknown'}`
    );
  },

  // ── Conversation State ───────────────────────────────────────────

  phaseChanged(conversationId: string, from: string, to: string): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.brightMagenta}[⟳]${c.reset} Phase: ${c.dim}${from}${c.reset} → ${c.bold}${to.toUpperCase()}${c.reset} ${c.dim}in ${conversationId}${c.reset}`
    );
  },

  conversationStalled(channelId: string): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.red}[⚠]${c.reset} ${c.red}Conversation stalled${c.reset} on ${channelId}`
    );
  },

  conversationRecovered(channelId: string): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.green}[✓]${c.reset} Conversation recovered on ${channelId}`
    );
  },

  conversationTerminated(channelId: string): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.red}[✗]${c.reset} Conversation terminated on ${channelId}`
    );
  },

  // ── System Events ────────────────────────────────────────────────

  stallDetectorStarted(): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.green}[✓]${c.reset} Stall detector ${c.green}started${c.reset}`
    );
  },

  redisBridgeConnected(): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.green}[✓]${c.reset} Redis bridge ${c.green}connected${c.reset}`
    );
  },

  activityPersistenceEnabled(streamKey: string): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.green}[✓]${c.reset} Activity persistence → ${c.cyan}${streamKey}${c.reset}`
    );
  },

  taskDispatched(taskId: string, channelId: string): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.brightYellow}[⚙]${c.reset} Task dispatched: ${c.bold}${taskId}${c.reset} → #${channelId}`
    );
  },

  autoCreatedChannel(name: string): void {
    console.log(
      `${c.dim}${ts()}${c.reset} ${c.blue}[+]${c.reset} Auto-created channel: ${c.blue}${name}${c.reset}`
    );
  },

  serverStopped(): void {
    console.log(`${c.dim}${ts()}${c.reset} ${c.yellow}[■]${c.reset} Server stopped`);
  },

  shutdownRequested(): void {
    console.log(`\n${c.dim}${ts()}${c.reset} ${c.yellow}[↓]${c.reset} Shutting down...`);
  },

  error(context: string, message: string): void {
    console.error(
      `${c.dim}${ts()}${c.reset} ${c.red}[✗]${c.reset} ${c.red}${context}:${c.reset} ${message}`
    );
  },
};

export default relay;
