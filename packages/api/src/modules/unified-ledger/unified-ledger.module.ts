import { Module } from '@nestjs/common';

/**
 * Compatibility marker only. The old unauthenticated flat-file ledger is retired.
 * Authenticated ledger authority lives in apps/api; public clients use its API.
 * Do not register the legacy controller/service or open a second ledger store.
 */
@Module({})
export class UnifiedLedgerModule {}
