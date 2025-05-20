import { Task } from '../types.js';
import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import { ComponentAnalysisStorage } from '../services/ComponentAnalysisStorage.js';
import { ComponentAnalysisNotifier } from '../services/ComponentAnalysisNotifier.js';

const execAsync = promisify(exec);

@Injectable()
export class ComponentAnalysisTask implements Task {
  type = 'component-analysis';

  constructor(
    private readonly storage: ComponentAnalysisStorage,
    private readonly notifier: ComponentAnalysisNotifier
  ) {}

  async execute() {
    try {
      // Run component analysis
      await execAsync('node scripts/find-lost-components-esm.js');

      // Read results
      const results = await fs.readFile('component-analysis-results.json', 'utf8');
      const parsedResults = JSON.parse(results);

      // Store results
      await this.storage.storeResults(parsedResults);

      // Get trends
      const trends = await this.storage.getTrends();

      // Notify about results
      await this.notifier.notifyResults(parsedResults, trends);

      return {
        results: parsedResults,
        trends,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      await this.notifier.notifyError(error);
      throw new Error(`Component analysis failed: ${error.message}`);
    }
  }
}