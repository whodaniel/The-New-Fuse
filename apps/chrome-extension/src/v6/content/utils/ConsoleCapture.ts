/**
 * Console log capture — part of giving Fuse Connect the same "in Chrome"
 * capabilities claude-in-chrome has (console log reading was previously
 * entirely absent from this extension: `grep -rn "captureVisibleTab|toDataURL|screenshot"`
 * and any console-hooking code came back empty in the original audit).
 *
 * Does NOT wrap `console.*` itself here — this class runs in the content
 * script's isolated JS world, which has its own separate `console` object
 * from the page's. Wrapping it here only ever captured this content
 * script's own internal logging, confirmed by live testing (a real
 * console.log() call from the page never showed up). The actual wrapping
 * happens in main-world-console-hook.ts, injected into the page's real JS
 * world per manifest.json's `"world": "MAIN"` content script entry; it has
 * no chrome.* API access there, so it bridges captured entries across the
 * world boundary via a DOM CustomEvent ('fuse-connect:console-entry'),
 * the same mechanism the page-world test bridge already uses. This class
 * just listens for that event and buffers what arrives, queryable by
 * pattern/level the same way claude-in-chrome's read_console_messages
 * tool works.
 */

export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface CapturedConsoleMessage {
  level: ConsoleLevel;
  args: string[];
  timestamp: number;
}

const MAX_BUFFERED_MESSAGES = 500;

class ConsoleCapture {
  private buffer: CapturedConsoleMessage[] = [];
  private installed = false;

  install(): void {
    if (this.installed) return;
    this.installed = true;

    document.addEventListener('fuse-connect:console-entry', ((event: CustomEvent) => {
      const detail = event.detail as { level: ConsoleLevel; args: string[]; timestamp: number };
      if (!detail || !Array.isArray(detail.args)) return;
      this.record(detail.level, detail.args, detail.timestamp);
    }) as EventListener);
  }

  private record(level: ConsoleLevel, stringifiedArgs: string[], timestamp: number): void {
    this.buffer.push({ level, args: stringifiedArgs, timestamp });
    if (this.buffer.length > MAX_BUFFERED_MESSAGES) {
      this.buffer.splice(0, this.buffer.length - MAX_BUFFERED_MESSAGES);
    }
  }

  /**
   * @param pattern Optional case-insensitive substring/regex-ish filter
   *   applied to each message's joined args, matching claude-in-chrome's
   *   read_console_messages `pattern` param.
   * @param onlyErrors When true, only 'error' level messages are returned.
   */
  query(
    options: { pattern?: string; onlyErrors?: boolean; limit?: number } = {}
  ): CapturedConsoleMessage[] {
    let results = this.buffer;
    if (options.onlyErrors) {
      results = results.filter((m) => m.level === 'error');
    }
    if (options.pattern) {
      let regex: RegExp | null = null;
      try {
        regex = new RegExp(options.pattern, 'i');
      } catch {
        // Invalid regex — fall back to plain substring matching below.
      }
      results = results.filter((m) => {
        const joined = m.args.join(' ');
        return regex
          ? regex.test(joined)
          : joined.toLowerCase().includes(options.pattern!.toLowerCase());
      });
    }
    const limit = options.limit ?? 100;
    return results.slice(-limit);
  }

  clear(): void {
    this.buffer = [];
  }
}

export const consoleCapture = new ConsoleCapture();
