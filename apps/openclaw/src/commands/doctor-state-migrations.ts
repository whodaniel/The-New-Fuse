export {
  autoMigrateLegacyAgentDir,
  autoMigrateLegacyState,
  autoMigrateLegacyStateDir,
  detectLegacyStateMigrations,
  migrateLegacyAgentDir,
  resetAutoMigrateLegacyAgentDirForTest,
  resetAutoMigrateLegacyStateDirForTest,
  resetAutoMigrateLegacyStateForTest,
  runLegacyStateMigrations,
} from '../infra/state-migrations.js';
export type { LegacyStateDetection } from '../infra/state-migrations.js';
