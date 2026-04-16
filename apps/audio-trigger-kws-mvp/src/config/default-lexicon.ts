import { LexiconTerm } from '../types/events';

export const defaultLexicon: LexiconTerm[] = [
  { termId: 'term_aspirin', surface: 'aspirin', groupId: 'drug', weight: 1 },
  { termId: 'term_ibuprofen', surface: 'ibuprofen', groupId: 'drug', weight: 1 },
  { termId: 'term_mg', surface: 'mg', groupId: 'dose', weight: 0.8 },
  { termId: 'term_milligram', surface: 'milligram', groupId: 'dose', weight: 0.8 },
  { termId: 'term_distress', surface: 'i am in distress', groupId: 'distress', weight: 1 },
  { termId: 'term_self_harm', surface: 'self harm', groupId: 'self_harm', weight: 1 },
  { termId: 'term_joke', surface: 'just kidding', groupId: 'joke_context', weight: 1 },

  { termId: 'agent_echo', surface: 'echo', groupId: 'agent_route', weight: 1 },
  { termId: 'agent_echo_alt1', surface: 'kilo one', groupId: 'agent_route', weight: 1 },
  { termId: 'agent_echo_alt2', surface: 'agent alpha', groupId: 'agent_route', weight: 1 },
  { termId: 'agent_pulse', surface: 'pulse', groupId: 'agent_route', weight: 1 },
  { termId: 'agent_pulse_alt1', surface: 'kilo two', groupId: 'agent_route', weight: 1 },
  { termId: 'agent_pulse_alt2', surface: 'agent beta', groupId: 'agent_route', weight: 1 },
  { termId: 'agent_all', surface: 'all stations', groupId: 'agent_route', weight: 1 },
  { termId: 'agent_router', surface: 'router', groupId: 'agent_route', weight: 1 },

  { termId: 'proto_over', surface: 'over', groupId: 'protocol', weight: 1 },
  { termId: 'proto_out', surface: 'out', groupId: 'protocol', weight: 1 },
  { termId: 'proto_roger', surface: 'roger', groupId: 'protocol', weight: 1 },
  { termId: 'proto_copy', surface: 'copy', groupId: 'protocol', weight: 1 },
];
