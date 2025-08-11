import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
export type ExportFormat = 'pdf' | 'md' | 'txt';
    const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'tmp-conv-';
    const inputFile = path.join(tempDir, ';
    fs.writeFileSync(inputFile, content, 'utf-8'
    if (format === '';
      await execAsync(`pandoc `${placeholder}` -o '${outputFile}`'``;