import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export type ExportFormat = 'pdf' | 'md' | 'txt';

export class ConversationExportService {
  /**
   * Exports conversation content to the desired format (PDF, Markdown, or Plain Text).
   * For PDF, uses Pandoc via CLI. For md/txt, saves directly.
   * @param content The conversation content (string, markdown, or plain text)
   * @param format Desired export format
   * @returns Buffer of the exported file
   */
  static async export(content: string, format: ExportFormat): Promise<Buffer> {
    const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'tmp-conv-'));
    const inputFile = path.join(tempDir, 'conversation.md');
    const outputFile = path.join(tempDir, `conversation.${format}`);
    fs.writeFileSync(inputFile, content, 'utf-8');

    if (format === 'pdf') {
      // Requires Pandoc to be installed on the system
      await execAsync(`pandoc "${inputFile}" -o "${outputFile}"`);
    } else {
      fs.copyFileSync(inputFile, outputFile);
    }

    const result = fs.readFileSync(outputFile);
    fs.rmSync(tempDir, { recursive: true, force: true });
    return result;
  }
}
