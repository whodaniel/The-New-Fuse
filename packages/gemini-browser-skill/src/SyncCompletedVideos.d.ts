#!/usr/bin/env ts-node
/**
 * Sync Completed Videos from library_import to processing_state.json
 *
 * This script reads the library_import folder (videos already processed in AI Studio)
 * and marks them as completed in the CLI's processing_state.json so they won't be reprocessed.
 */
export {};
