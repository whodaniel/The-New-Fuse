/**
 * tnf library bind / tnf timeline * — account-scoped personal knowledge.
 */
import chalk from 'chalk';
import type { Command } from 'commander';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PersonalKnowledgeService,
  type LibraryNarrativeItem,
} from '../services/PersonalKnowledgeService.js';
import { findCommand, getOrCreateCommand } from './_registry.js';

function defaultApiBase(): string {
  return (
    process.env.TNF_API_BASE ||
    process.env.TNF_LOCAL_API ||
    'http://127.0.0.1:3002/api'
  ).replace(/\/$/, '');
}

function requireToken(explicit?: string): string {
  const token = (explicit || process.env.TNF_JWT || process.env.TNF_TOKEN || '').trim();
  if (!token) {
    throw new Error('JWT required. Pass --token <jwt> or set TNF_JWT.');
  }
  return token;
}

function loadItemsFromFile(filePath: string): LibraryNarrativeItem[] {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [raw];
  return rows
    .map((row: any) => ({
      kind: (row.kind || 'factoid') as LibraryNarrativeItem['kind'],
      title: String(row.title || row.text || '').trim(),
      description: row.description ? String(row.description) : undefined,
      storyKey: row.storyKey ? String(row.storyKey) : undefined,
      eventDate: row.eventDate || row.date || row.timestamp,
      tags: Array.isArray(row.tags) ? row.tags.map(String) : undefined,
      libraryRefs: Array.isArray(row.libraryRefs) ? row.libraryRefs.map(String) : undefined,
      evidenceRefs: Array.isArray(row.evidenceRefs) ? row.evidenceRefs.map(String) : undefined,
      source: row.source ? String(row.source) : 'library-file-import',
      confidence: row.confidence,
      timelineTrack: row.timelineTrack || 'personal_knowledge',
    }))
    .filter((item: LibraryNarrativeItem) => item.title.length > 0);
}

export function registerPersonalKnowledgeCommands(program: Command, repoRoot?: string): void {
  const root =
    repoRoot ||
    process.env.TNF_REPO_ROOT ||
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

  const library = getOrCreateCommand(
    program,
    'library',
    'Virtual Library consolidation, audit, and account binding'
  );

  if (!findCommand(library, 'bind')) {
    library
      .command('bind')
      .description('Bind Virtual Library + notes vault to the authenticated TNF account')
      .option('--json', 'Machine-readable output')
      .action(async (options: { json?: boolean }) => {
        try {
          const svc = new PersonalKnowledgeService();
          const result = svc.bindAll({
            virtualLibraryEnvPath: path.join(
              root,
              'apps/extensions/virtual-library-blueprints/.env.local'
            ),
          });
          if (options.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
          }
          console.log(chalk.green('\n✅ Library bound to authenticated account\n'));
          console.log(`   Account:  ${chalk.cyan(result.binding.tnfAccountId)}`);
          console.log(`   Owner id: ${chalk.cyan(result.binding.ownerUserId)}`);
          console.log(`   Vault:    ${chalk.dim(result.notesVaultPath)}`);
          console.log(`   Aliases:  ${chalk.dim(result.ownerPrincipalAliases.join(', '))}`);
          console.log(`   Receipt:  ${chalk.dim(result.libraryBindingPath)}\n`);
        } catch (err: any) {
          console.error(chalk.red(`Error: ${err.message}`));
          process.exit(1);
        }
      });
  }

  if (!findCommand(library, 'wire-timeline')) {
    library
      .command('wire-timeline')
      .description('Push library stories/narratives/factoids into the account timeline')
      .option('--token <jwt>', 'Auth JWT (or TNF_JWT)')
      .option('--api <url>', 'API base including /api', defaultApiBase())
      .option('--file <path>', 'JSON file of narrative items')
      .option('--from-local', 'Import ~/.tnf/personal-intelligence factoid JSON')
      .option('--json', 'Machine-readable output')
      .action(
        async (options: {
          token?: string;
          api?: string;
          file?: string;
          fromLocal?: boolean;
          json?: boolean;
        }) => {
          try {
            const svc = new PersonalKnowledgeService();
            svc.bindAll({
              virtualLibraryEnvPath: path.join(
                root,
                'apps/extensions/virtual-library-blueprints/.env.local'
              ),
            });
            const token = requireToken(options.token);
            const items: LibraryNarrativeItem[] = [];
            if (options.file) items.push(...loadItemsFromFile(options.file));
            if (options.fromLocal) items.push(...svc.loadLocalFactoids());
            if (items.length === 0) {
              throw new Error(
                'No items to wire. Pass --file <json> and/or --from-local, or write factoids under ~/.tnf/personal-intelligence.'
              );
            }
            const result = await svc.syncNarrativesToTimeline({
              apiBase: options.api || defaultApiBase(),
              token,
              items,
            });
            if (options.json) {
              console.log(JSON.stringify(result, null, 2));
              return;
            }
            console.log(
              chalk.green(
                `\n✅ Wired ${result.linked}/${items.length} library narratives into timeline\n`
              )
            );
            for (const row of result.results.slice(0, 20)) {
              if (row.error) {
                console.log(`   ${chalk.red('✗')} ${row.storyKey}: ${row.error}`);
              } else {
                console.log(`   ${chalk.green('✓')} ${row.storyKey} → ${row.eventId || 'ok'}`);
              }
            }
            if (result.results.length > 20) {
              console.log(chalk.dim(`   … ${result.results.length - 20} more`));
            }
            console.log('');
          } catch (err: any) {
            console.error(chalk.red(`Error: ${err.message}`));
            process.exit(1);
          }
        }
      );
  }

  const timeline = getOrCreateCommand(
    program,
    'timeline',
    'Account-scoped personal timeline (unified-ledger)'
  );

  if (!findCommand(timeline, 'bind')) {
    timeline
      .command('bind')
      .description('Bind timeline surface to the authenticated TNF account')
      .option('--json', 'Machine-readable output')
      .action(async (options: { json?: boolean }) => {
        try {
          const svc = new PersonalKnowledgeService();
          const result = svc.bindAll({
            virtualLibraryEnvPath: path.join(
              root,
              'apps/extensions/virtual-library-blueprints/.env.local'
            ),
          });
          if (options.json) {
            console.log(
              JSON.stringify({ timeline: result.timelineBindingPath, ...result }, null, 2)
            );
            return;
          }
          console.log(chalk.green('\n✅ Timeline bound to authenticated account\n'));
          console.log(`   Account:  ${chalk.cyan(result.binding.tnfAccountId)}`);
          console.log(`   Owner id: ${chalk.cyan(result.binding.ownerUserId)}`);
          console.log(`   Receipt:  ${chalk.dim(result.timelineBindingPath)}\n`);
        } catch (err: any) {
          console.error(chalk.red(`Error: ${err.message}`));
          process.exit(1);
        }
      });
  }

  if (!findCommand(timeline, 'bootstrap')) {
    timeline
      .command('bootstrap')
      .description('Bootstrap private personal timeline segments for the JWT user')
      .option('--token <jwt>', 'Auth JWT (or TNF_JWT)')
      .option('--api <url>', 'API base including /api', defaultApiBase())
      .option('--json', 'Machine-readable output')
      .action(async (options: { token?: string; api?: string; json?: boolean }) => {
        try {
          const svc = new PersonalKnowledgeService();
          const token = requireToken(options.token);
          const body = await svc.bootstrapTimeline({
            apiBase: options.api || defaultApiBase(),
            token,
          });
          if (options.json) {
            console.log(JSON.stringify(body, null, 2));
            return;
          }
          console.log(chalk.green('\n✅ Timeline bootstrap complete\n'));
          console.log(JSON.stringify(body, null, 2));
          console.log('');
        } catch (err: any) {
          console.error(chalk.red(`Error: ${err.message}`));
          process.exit(1);
        }
      });
  }

  if (!findCommand(timeline, 'sync')) {
    timeline
      .command('sync')
      .description('Sync library narratives/factoids into the account timeline')
      .option('--token <jwt>', 'Auth JWT (or TNF_JWT)')
      .option('--api <url>', 'API base including /api', defaultApiBase())
      .option('--file <path>', 'JSON file of narrative items')
      .option('--from-local', 'Import ~/.tnf/personal-intelligence factoid JSON')
      .option('--json', 'Machine-readable output')
      .action(
        async (options: {
          token?: string;
          api?: string;
          file?: string;
          fromLocal?: boolean;
          json?: boolean;
        }) => {
          // Delegate to library wire-timeline semantics
          const svc = new PersonalKnowledgeService();
          try {
            svc.bindAll();
            const token = requireToken(options.token);
            const items: LibraryNarrativeItem[] = [];
            if (options.file) items.push(...loadItemsFromFile(options.file));
            if (options.fromLocal || (!options.file && !options.fromLocal)) {
              items.push(...svc.loadLocalFactoids());
            }
            // Always include a seed narrative so sync is useful even without local files
            if (items.length === 0) {
              const bound = svc.readLibraryBinding() || {};
              items.push({
                kind: 'narrative',
                title: 'Library ↔ Timeline account bridge',
                description:
                  'Personal knowledge surface bound to authenticated TNF account; library stories/narratives/factoids share this timeline owner.',
                tags: ['library', 'timeline', 'account-binding'],
                libraryRefs: ['binding:library-timeline'],
                source: 'timeline-sync-seed',
                confidence: 'strong',
                timelineTrack: 'personal_knowledge',
                storyKey: `nk_bridge_${String(bound.ownerUserId || 'account').slice(0, 8)}`,
              });
            }
            const result = await svc.syncNarrativesToTimeline({
              apiBase: options.api || defaultApiBase(),
              token,
              items,
            });
            if (options.json) {
              console.log(JSON.stringify(result, null, 2));
              return;
            }
            console.log(
              chalk.green(`\n✅ Timeline sync linked ${result.linked}/${items.length} items\n`)
            );
          } catch (err: any) {
            console.error(chalk.red(`Error: ${err.message}`));
            process.exit(1);
          }
        }
      );
  }

  if (!findCommand(timeline, 'status')) {
    timeline
      .command('status')
      .description('Show timeline + library account binding status')
      .option('--json', 'Machine-readable output')
      .action(async (options: { json?: boolean }) => {
        try {
          const svc = new PersonalKnowledgeService();
          const library = svc.readLibraryBinding();
          const timelineBinding = svc.readTimelineBinding();
          const payload = {
            home: process.env.TNF_HOME || path.join(os.homedir(), '.tnf'),
            library,
            timeline: timelineBinding,
          };
          if (options.json) {
            console.log(JSON.stringify(payload, null, 2));
            return;
          }
          console.log(chalk.bold('\n📚 Library / Timeline account binding\n'));
          if (!library && !timelineBinding) {
            console.log(
              chalk.yellow('  Not bound yet. Run: tnf library bind && tnf timeline bind\n')
            );
            return;
          }
          const owner =
            (library as any)?.tnfAccountId || (timelineBinding as any)?.tnfAccountId || 'n/a';
          const userId =
            (library as any)?.ownerUserId || (timelineBinding as any)?.ownerUserId || 'n/a';
          console.log(`   Account:  ${chalk.cyan(owner)}`);
          console.log(`   Owner id: ${chalk.cyan(userId)}`);
          console.log(`   Library:  ${library ? chalk.green('bound') : chalk.yellow('missing')}`);
          console.log(
            `   Timeline: ${timelineBinding ? chalk.green('bound') : chalk.yellow('missing')}\n`
          );
        } catch (err: any) {
          console.error(chalk.red(`Error: ${err.message}`));
          process.exit(1);
        }
      });
  }
}
