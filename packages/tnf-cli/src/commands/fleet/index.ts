/**
 * packages/tnf-cli/src/commands/fleet/index.ts
 *
 * Native TNF Harness commands for fleet terminal window inventory and prompt injection.
 * Implements TWIP §6 permanent window ID targeting, virtual hardware key code submission,
 * and harness telemetry logging.
 */

import type { Command } from 'commander';
import { execSync } from 'node:child_process';
import { getOrCreateCommand } from '../_registry.js';

export interface TerminalWindowRecord {
  id: number;
  name: string;
  historyTail: string;
  state: 'AWAITING_PROMPT' | 'INTERACTIVE_SELECT' | 'PROCESSING' | 'UNKNOWN';
}

/**
 * Query all active Terminal.app windows by permanent AppleScript ID and tail text.
 */
export function queryTerminalWindows(): TerminalWindowRecord[] {
  try {
    const applescript = `
tell application "Terminal"
  set resList to {}
  repeat with w in windows
    set wID to (id of w) as integer
    set wName to (name of w) as string
    set hText to (history of selected tab of w) as string
    set tailText to text -300 thru -1 of hText
    set end of resList to (wID as string) & "|||" & wName & "|||" & tailText
  end repeat
  set oldDelim to AppleScript's text item delimiters
  set AppleScript's text item delimiters to "###WIN_SPLIT###"
  set strRes to resList as text
  set AppleScript's text item delimiters to oldDelim
  return strRes
end tell
`;

    const rawOutput = execSync('osascript', {
      input: applescript,
      encoding: 'utf8',
      timeout: 10000,
    }).trim();

    if (!rawOutput) return [];

    const items = rawOutput.split('###WIN_SPLIT###');
    const records: TerminalWindowRecord[] = [];

    for (const item of items) {
      const parts = item.split('|||');
      if (parts.length < 3) continue;

      const id = Number.parseInt(parts[0].trim(), 10);
      const name = parts[1].trim();
      const historyTail = parts[2].trim();

      let state: TerminalWindowRecord['state'] = 'UNKNOWN';
      if (historyTail.includes('❯') || historyTail.includes('→ Add a follow-up')) {
        state = 'AWAITING_PROMPT';
      } else if (historyTail.includes('[ ]') || historyTail.includes('(Press space to select)')) {
        state = 'INTERACTIVE_SELECT';
      } else if (historyTail.includes('Thinking') || historyTail.includes('Boogieing')) {
        state = 'PROCESSING';
      }

      if (!Number.isNaN(id)) {
        records.push({ id, name, historyTail, state });
      }
    }

    return records;
  } catch (_err) {
    return [];
  }
}

/**
 * Prompt a target terminal window by permanent ID with hardware virtual key code submission.
 */
export function promptTerminalWindow(options: {
  targetId: number;
  message: string;
  toggleSpace?: boolean;
  noSubmit?: boolean;
}): { success: boolean; output: string } {
  try {
    const { targetId, message, toggleSpace, noSubmit } = options;

    const applescript = `
tell application "Terminal"
    if not (exists (first window whose id is ${targetId})) then
        return "WINDOW_NOT_FOUND"
    end if
    set isFront to frontmost of (first window whose id is ${targetId})
    if isFront then
        return "SKIPPED_OPERATOR_FRONTMOST"
    end if
    activate
    set frontmost of (first window whose id is ${targetId}) to true
    delay 0.3
end tell
tell application "System Events"
    tell process "Terminal"
        ${toggleSpace ? 'key code 49\ndelay 0.2' : ''}
        ${message ? `keystroke ${JSON.stringify(message)}` : ''}
        delay 0.3
        ${noSubmit ? '' : 'key code 36'}
    end tell
end tell
return "OK"
`;

    const result = execSync('osascript', {
      input: applescript,
      encoding: 'utf8',
      timeout: 10000,
    }).trim();

    return {
      success: result.includes('OK'),
      output: result,
    };
  } catch (err) {
    return {
      success: false,
      output: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Register `tnf fleet` commands in commander.
 */
export function registerFleetCommands(program: Command): Command {
  const fleet = getOrCreateCommand(
    program,
    'fleet',
    'TNF Harness fleet and terminal window management'
  );

  fleet
    .command('inventory')
    .description(
      'Query all active Terminal.app windows by permanent AppleScript ID and prompt state'
    )
    .option('--json', 'Output inventory as structured JSON')
    .action((opts) => {
      const records = queryTerminalWindows();
      if (opts.json) {
        console.log(
          JSON.stringify(
            { timestamp: new Date().toISOString(), total: records.length, windows: records },
            null,
            2
          )
        );
      } else {
        console.log(`\nFound ${records.length} active terminal window(s):\n`);
        for (const w of records) {
          console.log(`- Window ID: ${w.id} | Name: ${w.name} | State: ${w.state}`);
        }
        console.log('');
      }
    });

  fleet
    .command('prompt')
    .description(
      'Inject a prompt into a target terminal window by permanent ID with hardware Return submission'
    )
    .requiredOption('--target <id>', 'Target permanent AppleScript window ID', (val) =>
      Number.parseInt(val, 10)
    )
    .option('--message <text>', 'Prompt text to inject', '')
    .option('--space', 'Send space bar (key code 49) before message for interactive menu selection')
    .option('--no-submit', 'Do not send hardware Return key code after typing')
    .action((opts) => {
      const res = promptTerminalWindow({
        targetId: opts.target,
        message: opts.message,
        toggleSpace: !!opts.space,
        noSubmit: opts.submit === false,
      });

      if (res.success) {
        console.log(`✅ Prompts successfully injected to window ID ${opts.target}`);
      } else {
        console.error(`❌ Failed to prompt window ID ${opts.target}: ${res.output}`);
        process.exitCode = 1;
      }
    });

  return fleet;
}
