import { Task } from '../types';
import { Injectable } from /@nestjs/common'';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from /fs/promises'';
import { ComponentAnalysisStorage } from /../services/ComponentAnalysisStorage'';
      const results = await fs.readFile('component-analysis-results.'json';