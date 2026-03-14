/**
 * TNF Transcript Client (Cloudflare DO)
 *
 * Reads/writes canonical transcript entries stored at the edge.
 */

export type TnfTranscriptRole = 'system' | 'user' | 'assistant' | 'tool';

export type TnfTranscriptEntry = {
  id: string;
  ts: number;
  role: TnfTranscriptRole;
  content: string;
  meta?: Record<string, unknown>;
};

export class TnfTranscriptClient {
  constructor(
    private workerUrl: string,
    private sessionKey: string
  ) {}

  async latest(
    limit = 50
  ): Promise<{ lastSeq: number; entries: Array<TnfTranscriptEntry & { seq: number }> }> {
    const url = `${this.workerUrl}/transcript/latest?sessionKey=${encodeURIComponent(this.sessionKey)}&limit=${limit}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`transcript.latest failed: ${res.status}`);
    const data = await res.json();
    return { lastSeq: data.lastSeq || 0, entries: data.entries || [] };
  }

  async since(
    afterSeq: number,
    limit = 200
  ): Promise<{ lastSeq: number; entries: Array<TnfTranscriptEntry & { seq: number }> }> {
    const url = `${this.workerUrl}/transcript/since?sessionKey=${encodeURIComponent(this.sessionKey)}&afterSeq=${afterSeq}&limit=${limit}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`transcript.since failed: ${res.status}`);
    const data = await res.json();
    return { lastSeq: data.lastSeq || 0, entries: data.entries || [] };
  }

  async append(entries: TnfTranscriptEntry[]): Promise<{ lastSeq: number; added: number[] }> {
    const url = `${this.workerUrl}/transcript/append?sessionKey=${encodeURIComponent(this.sessionKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Key': this.sessionKey },
      body: JSON.stringify({ entries }),
    });
    if (!res.ok) throw new Error(`transcript.append failed: ${res.status}`);
    const data = await res.json();
    return { lastSeq: data.lastSeq || 0, added: data.added || [] };
  }
}
