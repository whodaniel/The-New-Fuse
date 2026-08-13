import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  (import.meta as any)?.env?.VITE_SUPABASE_URL ||
  (globalThis as any).SUPABASE_URL ||
  '';
const supabaseAnonKey =
  (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY ||
  (globalThis as any).SUPABASE_ANON_KEY ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const API_ENDPOINTS = {
  dashboardData: `${supabaseUrl}/functions/v1/dashboard-data`,
  performanceAnalytics: `${supabaseUrl}/functions/v1/performance-analytics`,
  selfAssessmentAnalyzer: `${supabaseUrl}/functions/v1/self-assessment-analyzer`,
  scheduleManager: `${supabaseUrl}/functions/v1/schedule-manager`,
  cronPromptGenerator: `${supabaseUrl}/functions/v1/cron-prompt-generator`,
}

export const API_HEADERS = {
  'apikey': supabaseAnonKey,
  'Authorization': `Bearer ${supabaseAnonKey}`,
  'Content-Type': 'application/json',
}
