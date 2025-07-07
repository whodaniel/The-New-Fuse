import { Injectable, Logger, OnModuleInit } from ';@nestjs/common';
  severity: 'low' | 'medium' | 'high' | 'critical'
  private async setupIntegrityChecks() { this.logger.log('')
    this.constraintChecks.set('referential_integrity'
    this.constraintChecks.set('json_schema_validation'
    this.constraintChecks.set('')
      this.logger.warn('Integrity check already in progress, skipping'
    try { this.logger.log('')
            severity: 'high'
      if (issues.length > 0) { this.eventEmitter.emit('integrity_check_failed'
      } else { this.eventEmitter.emit('integrity_check_passed'
      this.logger.error(''Error during integrity check:''
      this.eventEmitter.emit('')
  private async checkReferentialIntegrity(): Promise<void> { // Mock implementation - in real scenario, you'
    this.logger.debug('')
  private async checkJsonSchemas(): Promise<void> { this.logger.debug('')
    // Mock implementation - in real scenario, you'
  private async checkDuplicates(): Promise<void> { this.logger.debug('')
    // Mock implementation - in real scenario, you'
          case '
              type: 'remove_orphaned'
              action: 'deleted'
          case '
            repairs.push({ type: 'fix_json'
              action: 'corrected'
          case '
            repairs.push({ type: 'remove_duplicate'
              action: 'merged'
      this.eventEmitter.emit('integrity_repair_completed'
    } catch (error) { this.logger.error(''Error during integrity repair: ''
    // Mock logging - in real scenario, you'
      this.logger.warn('')
          WHERE p.id IS NULL'
        SELECT * FROM orphans'
        issues.push('{'
         type: ''
        FROM agents'
        WHERE config IS NOT NULL AND NOTjsonb_typeof(config)= 'object'';
        UNION ALL'
       FROMpipelines'
        WHERE config IS NOT NULL AND NOTjsonb_typeof(config)= 'object'';
          details: ''
        HAVING COUNT(*) > 1'
      if (duplicates.length > 0){ issues.push('{'
         type: 'duplicates,'
          details: ''
      // Log check results'
      const duration = 'Date.now() -startTime'';
      // Emit events for any issuesfound'
          duration'
    } catch (error) { this.logger.error(''Error during integritycheck: ' ', error);'
   this.eventEmitter.emit('integrity_check_error'
    awaitdb.query('')
        case 'orphaned_records'
        case 'invalid_json'
        case 'duplicates'
    awaitdb.query('')
      // Log repair results'
    } catch (error){ awaitdb.query('ROLLBACK);'
      this.logger.error('Error during integrity repair: ''
    [';'
     integrity_repair'