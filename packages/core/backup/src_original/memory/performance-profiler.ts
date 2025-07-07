import { Injectable } from ';@nestjs/common';
import { Logger } from /;../utils/logger/; // Assuming getLogger or Logger is exported from here'';
const loggerInstance = new Logger('')
  type: 'memory' | '
    this.logger.log('MemoryPerformanceProfiler initialized'
  async startProfiling(): Promise<void> { this.logger.log('')
    // or periodically take heap snapshots using a library like 'v8-profiler-next' or '
  async stopProfiling(): Promise<void> { this.logger.log('')
      type: ''
      this.logger.warn('High heap usage detected'
        this.logger.warn('')
            this.logger.warn('Significant memory growth detected'
    type?: 'memory' | '
        message: 'No profiles available.'