import { EventEmitter } from "node:events";
import crypto from "node:crypto";
import { AudioFrame, HitEvent, LexiconTerm } from '../types/events.js';

const normalize = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

interface PhraseEntry {
  tokens: string[];
  term: LexiconTerm;
}

export class KwsEngine extends EventEmitter {
  private readonly singleTokenMap = new Map<string, LexiconTerm>();
  private readonly phraseEntries: PhraseEntry[] = [];
  private readonly tokenHistoryByStream = new Map<string, Array<{ token: string; tsMs: number }>>();
  private maxPhraseLength = 1;

  constructor(private readonly lexicon: LexiconTerm[]) {
    super();
    for (const term of this.lexicon) {
      const normalized = normalize(term.surface);
      const tokens = normalized.split(/\s+/).filter(Boolean);
      if (tokens.length <= 1) {
        this.singleTokenMap.set(normalized, term);
      } else {
        this.phraseEntries.push({ tokens, term });
        this.maxPhraseLength = Math.max(this.maxPhraseLength, tokens.length);
      }
    }
  }

  push(frame: AudioFrame): void {
    const tokenRaw = frame.mockTranscript;
    if (!tokenRaw) {
      return;
    }

    const normalizedToken = normalize(tokenRaw);
    if (!normalizedToken) {
      return;
    }

    const tokenHistory = this.tokenHistoryByStream.get(frame.streamId) ?? [];
    tokenHistory.push({ token: normalizedToken, tsMs: frame.tsMs });
    while (tokenHistory.length > this.maxPhraseLength) {
      tokenHistory.shift();
    }
    this.tokenHistoryByStream.set(frame.streamId, tokenHistory);

    const singleMatch = this.singleTokenMap.get(normalizedToken);
    if (singleMatch) {
      this.emit("hit", this.buildHitEvent(frame, singleMatch, frame.tsMs, frame.tsMs + 150));
    }

    const historyTokens = tokenHistory.map((entry) => entry.token);
    for (const phrase of this.phraseEntries) {
      if (phrase.tokens.length > historyTokens.length) {
        continue;
      }
      const candidate = historyTokens.slice(historyTokens.length - phrase.tokens.length);
      if (candidate.join(" ") !== phrase.tokens.join(" ")) {
        continue;
      }

      const tsStartMs = tokenHistory[tokenHistory.length - phrase.tokens.length]?.tsMs ?? frame.tsMs;
      this.emit("hit", this.buildHitEvent(frame, phrase.term, tsStartMs, frame.tsMs + 150));
    }
  }

  private buildHitEvent(
    frame: AudioFrame,
    term: LexiconTerm,
    tsStartMs: number,
    tsEndMs: number
  ): HitEvent {
    const confidence = Math.min(0.99, Math.max(0.7, 0.75 + (term.weight ?? 1) * 0.15));

    return {
      eventId: crypto.randomUUID(),
      streamId: frame.streamId,
      tsStartMs,
      tsEndMs,
      termId: term.termId,
      groupId: term.groupId,
      confidence,
      source: "kws"
    };
  }
}

