-- Privacy hardening for Story Forge narrative tables
-- Applied on 2026-05-07 (owner: daniel)

begin;

-- Remove unnecessary privileges from anon/authenticated.
revoke delete, truncate, trigger, references, maintain on table public.story_sessions from anon, authenticated;
revoke delete, truncate, trigger, references, maintain on table public.timeline_events from anon, authenticated;
revoke delete, truncate, trigger, references, maintain on table public.story_session_agent_access from anon, authenticated;

commit;
