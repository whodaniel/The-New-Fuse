import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://dusrccpqwvdpzaohicap.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c3JjY3Bxd3ZkcHphb2hpY2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNjY3MTUsImV4cCI6MjA3NzY0MjcxNX0.9E98CVy_0wzfdTJb7dRhfORr4jwGmRFEK7EomLjhPGg";

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
