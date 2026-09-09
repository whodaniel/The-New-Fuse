import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { criticConfigPath, loadCriticConfig } from '../services/critic-config.js';
import {
  criticStateDir,
  reviewAgentTurn,
  type CriticReceipt,
} from '../services/TurnCriticService.js';

export function registerCriticCommands(program: Command, repoRoot: string): void {
  const critic = program.command('critic').description('Inspect and run the automatic turn critic');
  critic
    .command('config')
    .description('Show resolved user critic settings and their config path')
    .action(() => {
      console.log(
        JSON.stringify({ configPath: criticConfigPath(), critic: loadCriticConfig() }, null, 2)
      );
    });
  critic
    .command('status')
    .description('Show recent critic receipts and delivery status')
    .option('--json', 'Emit machine-readable JSON')
    .action((options: { json?: boolean }) => {
      const dir = criticStateDir();
      const receipts: CriticReceipt[] = fs.existsSync(dir)
        ? fs
            .readdirSync(dir)
            .filter((n) => /^[a-f0-9]{64}\.json$/.test(n))
            .flatMap((n) => {
              try {
                return [JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8'))];
              } catch {
                return [];
              }
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 20)
        : [];
      if (options.json) console.log(JSON.stringify(receipts, null, 2));
      else
        for (const r of receipts)
          console.log(
            `${r.createdAt} ${r.agentId} ${r.turnId}: ${r.status} / ${r.delivery?.type || '-'} ${r.delivery?.status || ''}${r.error ? ` (${r.error})` : ''}`
          );
    });
  critic
    .command('review')
    .description('Review a completed external-agent handoff and route its critique')
    .requiredOption('--handoff <path>', 'TNF session handoff JSON to review')
    .option('--json', 'Emit receipt JSON; prompt feedback remains queued')
    .action(async (options: { handoff: string; json?: boolean }) => {
      const h = JSON.parse(fs.readFileSync(path.resolve(options.handoff), 'utf8'));
      if (!h.handoff_id || !Array.isArray(h.work_summary))
        throw new Error('Expected a TNF handoff with handoff_id and work_summary');
      const r = await reviewAgentTurn(
        {
          agentId: process.env.TNF_AGENT_ID || h.agent_id || h.session_harness || 'external-agent',
          sessionId: h.session_id || process.env.TNF_SESSION_ID || h.handoff_id,
          turnId: h.handoff_id,
          input: `Review completed work at ${h.branch || 'unknown branch'} / ${h.head_sha || 'unknown revision'}`,
          output: h.work_summary.join('\n'),
          evidence: JSON.stringify({
            verification: h.verification,
            changed_paths: h.changed_paths,
            gaps: h.reflection?.gaps,
            evidenceScope: 'Handoff claims only; not independently observed tool results',
          }),
          source: process.env.TNF_AGENT_ROLE === 'critic' ? 'critic' : 'handoff',
        },
        {
          repoRoot,
          onPrompt: options.json
            ? undefined
            : (content) => {
                console.log(content);
              },
        }
      );
      if (options.json) console.log(JSON.stringify(r, null, 2));
      else if (r.status !== 'disabled' && r.status !== 'skipped')
        console.error(`[tnf critic] ${r.status}; delivery=${r.delivery?.status || 'none'}`);
    });
}
