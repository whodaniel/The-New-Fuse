// @ts-ignore
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
    const anonKey =
      process.env.SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzbHlkZ3RnaW5kcnl3bGRhdGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NjY4NTIsImV4cCI6MjA4NzU0Mjg1Mn0.5Vg04tY3XdhSuXw3HQmek4wT0Zi317n5xgKq5m9E_GI';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const explicitStoryKey = process.env.STORY_SUPABASE_KEY;
    const supabaseKey = explicitStoryKey || serviceRoleKey || anonKey;

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
    return sessions.find(s => s.status === 'active') || null;
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
        .select('*', { count: 'exact', head: true })
        .limit(1);
      if (sessionError) {
        result.story_sessions = { ok: false, message: this.extractErrorMessage(sessionError) };
      } else {
        result.story_sessions = { ok: true, message: 'Access granted' };
      }
    } catch (e: any) {
      result.story_sessions = { ok: false, message: e.message };
    }

    try {
      const { error: eventError } = await this.supabase
        .from('timeline_events')
        .select('*', { count: 'exact', head: true })
        .limit(1);
      if (eventError) {
        result.timeline_events = { ok: false, message: this.extractErrorMessage(eventError) };
      } else {
        result.timeline_events = { ok: true, message: 'Access granted' };
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
          `question:${params.questionId}`
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
    if (typeof error?.message === 'string' && error.message.trim().length > 0) {
      return error.message.trim();
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
