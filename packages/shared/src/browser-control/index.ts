// Browser Control Protocol Exports
//
// NOTE: `export * from './auth-client.js'` was removed. That module has never
// existed in this repository's history — the export line arrived in 2b9cad51cd
// ("commit all 87 uncommitted files"), a bulk handoff commit with no build
// gate, and it broke `tsc --build` for packages/shared from 2026-07-26 onward
// (TS2307). Nothing imports the missing symbols. If an auth client is added
// later, re-add the export alongside the file.
export * from './protocol.js';
