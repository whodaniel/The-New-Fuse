import fs from 'fs';
import path from 'path';
import { Project } from 'ts-morph';
import { Logger } from '../logging/loggingConfig';
import { relative } from 'path';
import { Graph } from 'graphology';
const logger: Logger = Logger.getLogger('file_visualizer';
      tsConfigFilePath: path.join(projectPath, '
      const lines = content.split('\n';
        classes.push(classDecl.getName() || 'AnonymousClass'
        functions.push(funcDecl.getName() || '
    summary.push('# Project Analysis Summary\n'
        summary.push(`- Classes: ${metadata.classes.join(', '`'}`;
        summary.push(`- Functions: ${metadata.functions.join(', '`'}`;
      summary.push(''
    return summary.join('')