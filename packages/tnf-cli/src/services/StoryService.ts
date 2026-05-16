// @ts-ignore
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://wslydgtgindrywldatbv.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzbHlkZ3RnaW5kcnl3bGRhdGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NjY4NTIsImV4cCI6MjA4NzU0Mjg1Mn0.5Vg04tY3XdhSuXw3HQmek4wT0Zi317n5xgKq5m9E_GI';
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async listSessions(ownerPrincipalId: string = 'daniel'): Promise<StorySession[]> {
    const { data, error } = await this.supabase
      .from('story_sessions')
      .select('*')
      .eq('owner_principal_id', ownerPrincipalId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getActiveSession(ownerPrincipalId: string = 'daniel'): Promise<StorySession | null> {
    const sessions = await this.listSessions(ownerPrincipalId);
    return sessions.find(s => s.status === 'active') || null;
  }

  async listTimelineEvents(ownerPrincipalId: string = 'daniel'): Promise<StoryTimelineEvent[]> {
    // Note: virtual-library-blueprints writes to public.timeline_events
    // We filter by owner_principal_id if available, or just list all for now
    const { data, error } = await this.supabase
      .from('timeline_events')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveCapture(params: {
    sessionId: string;
    questionId: number;
    ring: number;
    shelfCode: string;
    questionText: string;
    answerText: string;
  }): Promise<any> {
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

    if (error) throw error;
    return data;
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
