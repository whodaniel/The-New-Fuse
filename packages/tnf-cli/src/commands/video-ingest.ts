import { Command } from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';

function readDate(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/- \*\*Processed\*\*: (.*)/);
  return match ? match[1].trim() : '1970-01-01T00:00:00Z';
}

export function registerVideoIngestCommand(program: Command, repoRoot: string): void {
  program
    .command('video-ingest')
    .description('Ingest video intelligence against vetted corpus (Track 2)')
    .action(async () => {
      // Lazy load LLMClient to keep startup fast
      const { LLMClient } = await import('../utils/llm-client.js');
      const client = await LLMClient.create('worker');

      const corpusDir = path.join(repoRoot, 'data', 'video-reports');
      if (!fs.existsSync(corpusDir)) {
        console.error(`Corpus dir not found: ${corpusDir}`);
        process.exit(1);
      }

      // Track 2 dir
      const track2Dir = path.join(
        repoRoot,
        '..',
        'User-Data',
        os.userInfo().username,
        'intelligence-artifacts'
      );
      fs.mkdirSync(track2Dir, { recursive: true });

      const files = fs
        .readdirSync(corpusDir)
        .filter((f) => f.startsWith('v2_') && f.endsWith('.md'))
        .map((f) => path.join(corpusDir, f))
        .sort((a, b) => readDate(a).localeCompare(readDate(b)));

      console.log(`Found ${files.length} reports in vetted corpus. Routing to Track 2.`);
      let processed = 0;

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const urlMatch = content.match(/- \*\*URL\*\*: (.*)/);
        if (!urlMatch) continue;
        const url = urlMatch[1];

        let id = path.basename(file, '.md').replace('v2_', '');
        const idMatch = url.match(/watch\?v=([a-zA-Z0-9_-]+)/);
        if (idMatch) {
          id = idMatch[1];
        }

        const outFileJson = path.join(track2Dir, `${id}-v2-extracted.json`);
        if (fs.existsSync(outFileJson)) {
          // Check if already processed
          continue;
        }

        console.log(`\n▶ Extracting intelligence for ${id} (Track 2)...`);

        const prompt = `You are the TNF Multi-Vector Intelligence Engine. Ingest the provided video
transcript and extract actionable intelligence across all operational vectors:

### 1. Tooling & Ecosystem Discovery
- List all tools, libraries, GitHub repos, and MCP servers mentioned.
- Extract concrete installation/integration wiring examples.
- Document specific friction points or setup traps noted by the speaker.

### 2. Media Style & Presentation Emulation
- Analyze the video's pedagogical structure: Hook, narrative progression, visual demo timing, and conceptual metaphors.
- Generate a reusable 3-minute video script template for TNF emulating this presentation style.

### 3. Longitudinal Trends & Architectural Trajectory
- What underlying engineering pattern is demonstrated?
- Is this an emerging standard, an active trend, or a replacement for an older paradigm?
- How does this modify or reinforce TNF's existing architectural decisions?

### 4. Developer Experience & Workflow Ergonomics
- What UX/DX patterns (keyboard shortcuts, interface layouts, interaction loops) made the creator effective?
- How can TNF CLI / Chrome Extension / UI adopt these ergonomic flows?

### 5. Ground-Truth Realities & Failure Archaeology
- Extract unvarnished benchmarks, cost figures, local hardware constraints, and anti-patterns encountered.

### 6. User-Centric Creative Combinatorics (The Multi-Persona Lens)
- Brainstorm 2-3 novel, unexpected ways this information can be repurposed for end users with diverse passions (e.g., creative writing, indie business, personal learning, hobby projects).
- What unique cross-domain combinations emerge from this technique?

### 7. Meta-Extraction: Ingestion Parameter Expansion
- Identify any novel way the creator structured information, problem-solved, or operated that falls outside the above categories.
- Propose a concrete new extraction parameter / rule to permanently upgrade TNF's ingestion protocol.

### 8. Modality-Gap Analysis
- Identify transcript phrases or discontinuities that imply missing visual, audio, or linked-artifact context.
- For every material gap, record timestamp, modality, missing context, recovery plan, resolution status, and confidence.
- Keep claims dependent on unresolved gaps explicitly unverified.

### 9. Executable Distillation
- Emit atomic actionable factoids with source timestamps, confidence, and verification needs.
- Emit implementation plans that map to an existing TNF target surface and include inspect, implementation, and verification steps.
- Reconcile each processed video into the action queue or a reasoned non-actionable/deferred state.

OUTPUT STRICTLY AS VALID JSON. DO NOT INCLUDE MARKDOWN CODE BLOCKS AROUND THE JSON.

Video Report:
${content}`;

        try {
          const response = await client.chatComplete([{ role: 'user', content: prompt }], {
            maxTokens: 8000,
            temperature: 0.1,
          });

          let cleaned = response.trim();
          if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\n?/, '');
          if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\n?/, '');
          if (cleaned.endsWith('```')) cleaned = cleaned.replace(/\n?```$/, '');

          const parsed = JSON.parse(cleaned);

          fs.writeFileSync(outFileJson, JSON.stringify(parsed, null, 2));
          console.log(`✅ Saved ${outFileJson}`);
          processed++;
        } catch (e) {
          console.error(`Failed to process ${id}:`, e instanceof Error ? e.message : e);
        }
      }

      console.log(`\nDone. Processed ${processed} new videos into Track 2.`);
    });
}
