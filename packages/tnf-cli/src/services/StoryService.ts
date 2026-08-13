// @ts-ignore
import { createClient } from '@supabase/supabase-js';

export interface StorySession {
  id: string;
  user_id: string;
  owner_principal_id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface StoryQuestion {
  id: number;
  text: string;
  ring: number;
  shelfCode: string;
  ddcLabel: string;
  answer: string;
  captured: boolean;
}

export interface StoryTimelineEvent {
  id: string;
  type: string;
  event_date: string;
  title: string;
  description?: string;
  era?: number;
  sourceType?: string;
  tags?: string[];
  sourceQuestionId?: number;
  sourceSessionId?: string;
}

export class StoryService {
  private supabase: any;
  private readonly defaultOwnerPrincipalId: string;
  private readonly authMode: 'service-role' | 'anon';

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://wslydgtgindrywldatbv.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const explicitStoryKey = process.env.STORY_SUPABASE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseKey = explicitStoryKey || serviceRoleKey || anonKey;

    if (!supabaseKey) {
      throw new Error(
        'StoryService requires SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, or STORY_SUPABASE_KEY env var. ' +
          'Hardcoded keys removed for security — set one in your shell or .env file.'
      );
    }

    this.authMode = supabaseKey === serviceRoleKey && !!serviceRoleKey ? 'service-role' : 'anon';
    this.defaultOwnerPrincipalId = this.resolveOwnerPrincipalId(
      process.env.STORY_OWNER_PRINCIPAL_ID || process.env.TNF_OWNER_PRINCIPAL_ID || 'daniel'
    );

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async listSessions(ownerPrincipalId?: string): Promise<StorySession[]> {
    const resolvedOwner = this.resolveOwnerPrincipalId(ownerPrincipalId);
    const { data, error } = await this.supabase
      .from('story_sessions')
      .select('*')
      .eq('owner_principal_id', resolvedOwner)
      .order('updated_at', { ascending: false });

    if (error) throw this.wrapSupabaseError('list story sessions', error);
    return data || [];
  }

  async getActiveSession(ownerPrincipalId?: string): Promise<StorySession | null> {
    const sessions = await this.listSessions(ownerPrincipalId);
    return sessions.find((s) => s.status === 'active') || null;
  }

  async createSession(params: {
    title: string;
    description?: string;
    ownerPrincipalId?: string;
  }): Promise<StorySession> {
    const resolvedOwner = this.resolveOwnerPrincipalId(params.ownerPrincipalId);

    const { data, error } = await this.supabase
      .from('story_sessions')
      .insert({
        title: params.title,
        description: params.description,
        owner_principal_id: resolvedOwner,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw this.wrapSupabaseError('create story session', error);
    return data;
  }

  getQuestions(): StoryQuestion[] {
    return [
      {
        id: 1,
        ring: 1,
        text: 'What was the emotional catalyst for starting TNF in May 2025?',
        answer: '',
        captured: false,
        shelfCode: '000',
        ddcLabel: 'Computer Science & General Works',
      },
      {
        id: 2,
        ring: 1,
        text: "Why 'The New Fuse'? What does the name mean to you?",
        answer: '',
        captured: false,
        shelfCode: '000',
        ddcLabel: 'Computer Science & General Works',
      },
      {
        id: 3,
        ring: 1,
        text: 'What is the connecting thread between your 120+ projects?',
        answer: '',
        captured: false,
        shelfCode: '300',
        ddcLabel: 'Social Sciences',
      },
      {
        id: 4,
        ring: 2,
        text: 'What happened between June and August 2025? The git history goes quiet.',
        answer: '',
        captured: false,
        shelfCode: '900',
        ddcLabel: 'History & Geography',
      },
      {
        id: 5,
        ring: 2,
        text: "What is the Crystal of Consciousness? It's both a philosophy book and a synth preset.",
        answer: '',
        captured: false,
        shelfCode: '100',
        ddcLabel: 'Philosophy & Psychology',
      },
      {
        id: 6,
        ring: 2,
        text: "What is the empire's SECRET — the thing it tells itself about itself that isn't true?",
        answer: '',
        captured: false,
        shelfCode: '100',
        ddcLabel: 'Philosophy & Psychology',
      },
      {
        id: 7,
        ring: 3,
        text: "You have 8 books but only TNF is monetized. Why haven't you monetized the books?",
        answer: '',
        captured: false,
        shelfCode: '800',
        ddcLabel: 'Literature',
      },
      {
        id: 8,
        ring: 3,
        text: 'Aeon and EXTREAMIX seem related. Are they the same vision?',
        answer: '',
        captured: false,
        shelfCode: '600',
        ddcLabel: 'Technology',
      },
      {
        id: 9,
        ring: 3,
        text: 'Where do Aeon (blockchain freedom) and TNF (centralized orchestration) agree?',
        answer: '',
        captured: false,
        shelfCode: '200',
        ddcLabel: 'Religion',
      },
      {
        id: 10,
        ring: 4,
        text: 'Every project follows Build→Crisis→Fix→Evolve. Is this conscious methodology?',
        answer: '',
        captured: false,
        shelfCode: '500',
        ddcLabel: 'Science',
      },
      {
        id: 11,
        ring: 4,
        text: 'What is this story REALLY about — not the plot, the theme?',
        answer: '',
        captured: false,
        shelfCode: '800',
        ddcLabel: 'Literature',
      },
      {
        id: 12,
        ring: 4,
        text: "What would this story look like told from the antagonist's perspective?",
        answer: '',
        captured: false,
        shelfCode: '100',
        ddcLabel: 'Philosophy & Psychology',
      },
      {
        id: 13,
        ring: 5,
        text: 'What part of this story are you AVOIDING?',
        answer: '',
        captured: false,
        shelfCode: '100',
        ddcLabel: 'Philosophy & Psychology',
      },
      {
        id: 14,
        ring: 5,
        text: 'What do you want the reader to FEEL when they finish this book?',
        answer: '',
        captured: false,
        shelfCode: '700',
        ddcLabel: 'Arts & Recreation',
      },
      {
        id: 15,
        ring: 5,
        text: "What is the story you're telling yourself by telling this story?",
        answer: '',
        captured: false,
        shelfCode: '400',
        ddcLabel: 'Language',
      },
    ];
  }

  async getCapturedQuestionIds(sessionId: string): Promise<number[]> {
    const { data, error } = await this.supabase
      .from('timeline_events')
      .select('tags')
      .eq('session_id', sessionId);

    if (error) throw this.wrapSupabaseError('fetch captured questions', error);

    const ids: number[] = [];
    for (const row of data || []) {
      if (Array.isArray(row.tags)) {
        for (const tag of row.tags) {
          if (tag.startsWith('question:')) {
            const id = parseInt(tag.split(':')[1], 10);
            if (!isNaN(id)) ids.push(id);
          }
        }
      }
    }
    return ids;
  }

  async listTimelineEvents(ownerPrincipalId?: string): Promise<StoryTimelineEvent[]> {
    const resolvedOwner = this.resolveOwnerPrincipalId(ownerPrincipalId);
    const sessions = await this.listSessions(resolvedOwner);
    const sessionIds = sessions
      .map((session) => session.id)
      .filter((id) => typeof id === 'string' && id.trim().length > 0);
    if (sessionIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('timeline_events')
      .select('*')
      .in('session_id', sessionIds)
      .order('event_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw this.wrapSupabaseError('list story timeline events', error);
    return data || [];
  }

  async doctor(): Promise<{
    url: string;
    authMode: string;
    owner: string;
    story_sessions: { ok: boolean; message: string };
    timeline_events: { ok: boolean; message: string };
  }> {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://wslydgtgindrywldatbv.supabase.co';
    const result = {
      url: supabaseUrl,
      authMode: this.authMode,
      owner: this.defaultOwnerPrincipalId,
      story_sessions: { ok: false, message: 'Checking...' },
      timeline_events: { ok: false, message: 'Checking...' },
    };

    try {
      const { error: sessionError } = await this.supabase
        .from('story_sessions')
        .select('id')
        .limit(1);
      if (sessionError) {
        result.story_sessions = { ok: false, message: this.extractErrorMessage(sessionError) };
      } else {
        result.story_sessions = { ok: true, message: 'SELECT access granted' };
      }
    } catch (e: any) {
      result.story_sessions = { ok: false, message: e.message };
    }

    try {
      const { error: eventError } = await this.supabase
        .from('timeline_events')
        .select('id')
        .limit(1);
      if (eventError) {
        result.timeline_events = { ok: false, message: this.extractErrorMessage(eventError) };
      } else {
        result.timeline_events = { ok: true, message: 'SELECT access granted' };
      }
    } catch (e: any) {
      result.timeline_events = { ok: false, message: e.message };
    }

    return result;
  }

  async saveCapture(params: {
    sessionId: string;
    questionId: number;
    ring: number;
    shelfCode: string;
    questionText: string;
    answerText: string;
    ownerPrincipalId?: string;
  }): Promise<any> {
    const resolvedOwner = this.resolveOwnerPrincipalId(params.ownerPrincipalId);
    const session = await this.getSessionById(params.sessionId, resolvedOwner);
    if (!session) {
      throw new Error(
        `Story session "${params.sessionId}" was not found for owner "${resolvedOwner}".`
      );
    }

    const eventId = `story-capture-${params.sessionId}-${params.questionId}`;

    // 1. Save to timeline_events (for library and synced timeline)
    // We include Codex's new tag format: session:<id> and question:<id>
    const { data, error } = await this.supabase
      .from('timeline_events')
      .upsert({
        id: eventId,
        session_id: params.sessionId,
        era: this.mapRingToEra(params.ring),
        event_date: new Date().toISOString().split('T')[0],
        title: `Story Insight: ${params.shelfCode}`,
        description: `Q: ${params.questionText}\n\nA: ${params.answerText}`,
        source_type: 'story-architect-cli',
        tags: [
          'story-architect',
          'cli-capture',
          params.shelfCode,
          `session:${params.sessionId}`,
          `question:${params.questionId}`,
        ],
      })
      .select()
      .single();

    if (error) throw this.wrapSupabaseError('capture story timeline event', error);
    return data;
  }

  private async getSessionById(
    sessionId: string,
    ownerPrincipalId: string
  ): Promise<StorySession | null> {
    const { data, error } = await this.supabase
      .from('story_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('owner_principal_id', ownerPrincipalId)
      .maybeSingle();

    if (error) throw this.wrapSupabaseError('validate story session ownership', error);
    return data || null;
  }

  private resolveOwnerPrincipalId(ownerPrincipalId?: string): string {
    if (typeof ownerPrincipalId === 'string' && ownerPrincipalId.trim().length > 0) {
      return ownerPrincipalId.trim();
    }
    return this.defaultOwnerPrincipalId;
  }

  private wrapSupabaseError(action: string, error: any): Error {
    const message = this.extractErrorMessage(error);
    if (this.isPermissionError(error)) {
      const authHint =
        this.authMode === 'service-role'
          ? 'Service-role credentials are active; verify row filters and table grants.'
          : 'Anon credentials are active; set SUPABASE_SERVICE_ROLE_KEY (or STORY_SUPABASE_KEY) for trusted CLI writes.';
      return new Error(`Failed to ${action}: ${message}. ${authHint}`);
    }
    return new Error(`Failed to ${action}: ${message}`);
  }

  private isPermissionError(error: any): boolean {
    const code = typeof error?.code === 'string' ? error.code : '';
    const message = this.extractErrorMessage(error).toLowerCase();
    return code === '42501' || message.includes('permission denied');
  }

  private extractErrorMessage(error: any): string {
    const parts: string[] = [];
    if (typeof error?.message === 'string' && error.message.trim().length > 0) {
      parts.push(error.message.trim());
    }
    if (typeof error?.details === 'string' && error.details.trim().length > 0) {
      parts.push(`details: ${error.details.trim()}`);
    }
    if (typeof error?.hint === 'string' && error.hint.trim().length > 0) {
      parts.push(`hint: ${error.hint.trim()}`);
    }
    if (typeof error?.code === 'string' && error.code.trim().length > 0) {
      parts.push(`code: ${error.code.trim()}`);
    }
    if (typeof error?.status === 'number') {
      parts.push(`status: ${error.status}`);
    }
    if (parts.length > 0) {
      return parts.join(' | ');
    }
    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== '{}') {
        return serialized;
      }
    } catch {
      // ignore JSON stringify failures
    }
    return 'Unknown Supabase error';
  }

  private mapRingToEra(ring: number): number {
    const mapping: Record<number, number> = {
      1: 1,
      2: 3,
      3: 5,
      4: 7,
      5: 8,
    };
    return mapping[ring] || ring;
  }
}
