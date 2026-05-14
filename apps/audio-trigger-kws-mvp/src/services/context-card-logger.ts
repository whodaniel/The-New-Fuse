import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
 AutoPromptRun,
 ContextLogCard,
 SelfAssessmentResult,
 SelfAdjustmentAction,
} from '../types/events';
import { WikiIndexUpdater } from './wiki-index-updater';

export interface ContextCardLoggerInput {
 run: AutoPromptRun;
 assessment: SelfAssessmentResult;
}

const slugify = (value: string): string =>
 value
   .toLowerCase()
   .trim()
   .replace(/[^a-z0-9]+/g, '-')
   .replace(/^-+|-+$/g, '') || 'unknown';

const formatAdjustment = (adjustment: SelfAdjustmentAction): string => {
 const before = adjustment.previousThreshold.toFixed(3);
 const after = adjustment.newThreshold.toFixed(3);
 return `- ${adjustment.thresholdKey}: ${before} -> ${after} (${adjustment.reason})`;
};

export class ContextCardLogger {
 private readonly wikiIndexUpdater: WikiIndexUpdater | null;

 constructor(private readonly baseDir: string) {
   const looksLikeWikiRoot = path.basename(this.baseDir).toLowerCase() === 'wiki';
   this.wikiIndexUpdater = looksLikeWikiRoot ? new WikiIndexUpdater(this.baseDir) : null;
 }

  writeCard(input: ContextCardLoggerInput): ContextLogCard {
    const createdAt = new Date().toISOString();
    const cardId = crypto.randomUUID();
    const dayStamp = createdAt.slice(0, 10);

    const agentSlug = slugify(input.run.agentId);
    const useCaseSlug = slugify(input.run.useCase);

    const looksLikeWikiRoot = path.basename(this.baseDir).toLowerCase() === 'wiki';
    const jsonlDir = looksLikeWikiRoot
      ? path.join(path.dirname(this.baseDir), 'context-card-jsonl')
      : path.join(this.baseDir, 'jsonl');
    const wikiDir = looksLikeWikiRoot
      ? path.join(this.baseDir, 'agent-context-cards', agentSlug)
      : path.join(this.baseDir, 'wiki', agentSlug);
    const jsonlPath = path.join(jsonlDir, `${dayStamp}.jsonl`);
    const markdownPath = path.join(wikiDir, `${useCaseSlug}.md`);

    fs.mkdirSync(jsonlDir, { recursive: true });
    fs.mkdirSync(wikiDir, { recursive: true });

    const stepsList = input.run.steps
      .map((step, index) => `${index + 1}. [${step.status}] ${step.title}: ${step.prompt}`)
      .join('\n');

    const adjustments = input.assessment.adjustments.length
      ? input.assessment.adjustments.map((adjustment) => formatAdjustment(adjustment)).join('\n')
      : '- none';

    const markdown = [
      `## ${createdAt} | ${input.run.sequenceId}`,
      `- card_id: ${cardId}`,
      `- run_id: ${input.run.runId}`,
      `- stream_id: ${input.run.streamId}`,
      `- trigger_source: ${input.run.trigger.source}`,
      `- trigger_confidence: ${input.run.trigger.confidence.toFixed(3)}`,
      `- overall_score: ${input.assessment.overallScore.toFixed(1)}`,
      `- passed: ${input.assessment.passed}`,
      '- adjustments:',
      adjustments,
      '- prompt_sequence:',
      stepsList,
      '',
    ].join('\n');

    const card: ContextLogCard = {
      cardId,
      runId: input.run.runId,
      sequenceId: input.run.sequenceId,
      streamId: input.run.streamId,
      agentId: input.run.agentId,
      useCase: input.run.useCase,
      summary: {
        source: input.run.trigger.source,
        confidence: input.run.trigger.confidence,
        overallScore: input.assessment.overallScore,
        passed: input.assessment.passed,
      },
      jsonlPath,
      markdownPath,
      createdAt,
    };

 fs.appendFileSync(jsonlPath, `${JSON.stringify({ card, run: input.run, assessment: input.assessment })}\n`, 'utf8');
 fs.appendFileSync(markdownPath, markdown, 'utf8');

 if (this.wikiIndexUpdater) {
   this.wikiIndexUpdater.onCardWritten(card);
 }

 return card;
 }
}
