import { LexiconTerm } from "../types/events";

export const defaultLexicon: LexiconTerm[] = [
  { termId: "term_aspirin", surface: "aspirin", groupId: "drug", weight: 1 },
  { termId: "term_ibuprofen", surface: "ibuprofen", groupId: "drug", weight: 1 },
  { termId: "term_mg", surface: "mg", groupId: "dose", weight: 0.8 },
  { termId: "term_milligram", surface: "milligram", groupId: "dose", weight: 0.8 },
  { termId: "term_distress", surface: "i am in distress", groupId: "distress", weight: 1 },
  { termId: "term_self_harm", surface: "self harm", groupId: "self_harm", weight: 1 },
  { termId: "term_joke", surface: "just kidding", groupId: "joke_context", weight: 1 }
];

