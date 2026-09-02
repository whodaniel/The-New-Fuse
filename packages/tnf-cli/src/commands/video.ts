#!/usr/bin/env node
/**
 * packages/tnf-cli/src/commands/video.ts
 *
 * Thin CLI bridge to the shared video-intelligence pipeline scripts:
 *   modality_gap_pass.py      (detect modality gaps from transcript)
 *   visual_recovery.py        (frame/audio recovery for unresolved gaps)
 *   ingestion_completion_gate.py (enforce manifest-to-queue completion gate)
 *
 * Benefits every agent that can run `tnf video <subcommand>` instead of
 * hand-rolling Python invocations. Scripts remain the single source of
 * truth; this only standardizes invocation.
 *
 * Ephemeral frame policy (`data/video-frames/`): frames are deleted after
 * descriptions are written into gaps JSON. This command does not create
 * durable frame storage.
 */
import { spawnSync } from 'child_process';
import { Command } from 'commander';
import path from 'path';

function makeRunPython(repoRoot: string) {
  const scriptsDir = path.join(repoRoot, 'scripts', 'video');
  return function runPython(script: string, args: string[]): number {
    const res = spawnSync('python3', [path.join(scriptsDir, script), ...args], {
      stdio: 'inherit',
      cwd: repoRoot,
    });
    return res.status ?? 1;
  };
}

export function registerVideoCommands(program: Command, repoRoot: string): void {
  const runPython = makeRunPython(repoRoot);
  const video = program
    .command('video')
    .description('Shared video-intelligence pipeline (all agents)');

  video
    .command('modality-gap-pass')
    .description('Detect modality gaps in a timestamped transcript')
    .requiredOption('--transcript <path>', 'transcript file (VTT/bracketed/plain)')
    .requiredOption('--output <path>', 'write gaps JSON here')
    .option('--min-confidence <n>', 'minimum confidence threshold', '0.5')
    .action((opts) => {
      process.exitCode = runPython('modality_gap_pass.py', [
        '--transcript',
        opts.transcript,
        '--output',
        opts.output,
        '--min-confidence',
        String(opts.minConfidence),
      ]);
    });

  video
    .command('visual-recovery')
    .description('Resolve visual gaps via frames + OCR/vision model')
    .requiredOption('--gaps <path>', 'gaps JSON from modality-gap-pass')
    .requiredOption('--out-dir <dir>', 'frame output directory')
    .option('--video-url <url>', 'YouTube/video URL')
    .option('--video-file <path>', 'local video file')
    .option('--vision-cmd <cmd>', 'command template with {frame}')
    .option('--ocr', 'try tesseract OCR before vision', false)
    .option('--max-gaps <n>', 'limit gaps to process', '25')
    .action((opts) => {
      const args = [
        '--gaps',
        opts.gaps,
        '--out-dir',
        opts.outDir,
        '--max-gaps',
        String(opts.maxGaps),
      ];
      if (opts.videoUrl) args.push('--video-url', opts.videoUrl);
      if (opts.videoFile) args.push('--video-file', opts.videoFile);
      if (opts.visionCmd) args.push('--vision-cmd', opts.visionCmd);
      if (opts.ocr) args.push('--ocr');
      process.exitCode = runPython('visual_recovery.py', args);
    });

  video
    .command('ingestion-completion-gate')
    .description('Enforce manifest-to-action-queue completion gate')
    .requiredOption('--manifest <path>', 'pipeline manifest JSON')
    .requiredOption('--action-queue <path>', 'action queue JSON')
    .option('--gaps-dir <dir>', 'directory containing gaps_*.json reports')
    .option('--json <path>', 'write machine-readable verdict here')
    .action((opts) => {
      const args = ['--manifest', opts.manifest, '--action-queue', opts.actionQueue];
      if (opts.gapsDir) args.push('--gaps-dir', opts.gapsDir);
      if (opts.json) args.push('--json', opts.json);
      process.exitCode = runPython('ingestion_completion_gate.py', args);
    });
}
