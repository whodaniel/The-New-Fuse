/**
 * Gate interactive CLI surfaces (boot / tui) on an active profile session.
 * After `tnf logout`, the next boot/tui must re-authenticate (cloud-capable).
 */
import chalk from 'chalk';
import { spawnSync } from 'node:child_process';
import * as readline from 'node:readline';
import { ProfileSessionService } from '../services/ProfileSessionService.js';

function askYesNo(question: string, defaultYes = true): Promise<boolean> {
  if (!process.stdin.isTTY) return Promise.resolve(false);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const hint = defaultYes ? 'Y/n' : 'y/N';
  return new Promise((resolve) => {
    rl.question(`${question} [${hint}] `, (answer) => {
      rl.close();
      const raw = String(answer || '')
        .trim()
        .toLowerCase();
      if (!raw) {
        resolve(defaultYes);
        return;
      }
      resolve(raw === 'y' || raw === 'yes');
    });
  });
}

export function openCloudLoginPage(endpoint: string): void {
  const base = endpoint.replace(/\/$/, '');
  const url = `${base}/login`;
  console.log(chalk.dim(`  Opening cloud sign-in: ${url}`));
  try {
    const opener =
      process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
    spawnSync(opener, args, { stdio: 'ignore' });
  } catch {
    console.log(chalk.yellow(`  Open this URL in a browser: ${url}`));
  }
}

export async function ensureProfileSessionOrPrompt(options: {
  /** When true, refuse to continue without a session (exit guidance). */
  required?: boolean;
  /** Prefer cloud-linked session (app.thenewfuse.com). */
  cloud?: boolean;
  profile?: string;
}): Promise<{ ok: boolean; prompted: boolean }> {
  const sessions = new ProfileSessionService();
  const profile = options.profile || sessions.getActiveProfileName();
  if (sessions.isAuthenticated(profile)) {
    return { ok: true, prompted: false };
  }

  const required = options.required !== false;
  const cloud = options.cloud !== false;

  console.log('');
  console.log(chalk.yellow(`No active TNF session for profile '${profile}'.`));
  console.log(
    chalk.dim(
      '  Sign-in is required after logout (and on first install). Cloud accounts — including free — use `tnf login`.'
    )
  );

  if (process.stdin.isTTY) {
    const yes = await askYesNo('Sign in now with cloud account?', true);
    if (yes) {
      try {
        const session = sessions.login({
          profile,
          cloud,
          identityMode: cloud ? 'cloud' : 'local',
        });
        console.log(chalk.green(`Authenticated profile '${session.profile}'`));
        if (session.cloudEndpoint) {
          openCloudLoginPage(session.cloudEndpoint);
          console.log(
            chalk.dim(
              '  Complete browser sign-in on app.thenewfuse.com if prompted (free accounts OK).'
            )
          );
          console.log(
            chalk.dim(
              '  Desktop “Open SaaS builder” uses the same cloud identity once you are signed in there.'
            )
          );
        }
        return { ok: true, prompted: true };
      } catch (err) {
        console.error(
          chalk.red(`Login failed: ${err instanceof Error ? err.message : String(err)}`)
        );
      }
    }
  }

  console.log(chalk.cyan('  Run: tnf login'));
  console.log(chalk.dim('  (cloud profile auth — works for free accounts too)'));
  console.log('');

  if (required) {
    return { ok: false, prompted: true };
  }
  return { ok: true, prompted: true };
}
