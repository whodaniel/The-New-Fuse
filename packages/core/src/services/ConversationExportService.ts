import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export type ExportFormat = 'pdf' | 'md' | 'txt';

export class ConversationExportService {
  async exportConversation(
    content: string,
    format: ExportFormat,
    outputPath: string,
  ): Promise<string> {
    const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'tmp-conv-'));
    const inputFile = path.join(tempDir, 'input.md');
    const outputFile = path.join(tempDir, `output.${format}`);

    try {
      fs.writeFileSync(inputFile, content, 'utf-8');

      if (format === 'pdf') {
        await execAsync(`pandoc "${inputFile}" -o "${outputFile}"`);
      } else if (format === 'md') {
        fs.copyFileSync(inputFile, outputFile);
      } else if (format === 'txt') {
        fs.writeFileSync(outputFile, content, 'utf-8');
      }

      const finalPath = path.join(outputPath, `conversation.${format}`);
      fs.copyFileSync(outputFile, finalPath);

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });

      return finalPath;
    } catch (error) {
      // Cleanup on error
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      throw error;
    }
  }

  async exportToMarkdown(conversation: any[]): Promise<string> {
    let markdown = '# Conversation Export\n\n';

    for (const message of conversation) {
      markdown += `## ${message.role || 'User'}\n\n`;
      markdown += `${message.content}\n\n`;
      markdown += `_${new Date(message.timestamp).toLocaleString()}_\n\n`;
      markdown += '---\n\n';
    }

    return markdown;
  }

  async exportToJSON(conversation: any[]): Promise<string> {
    return JSON.stringify(conversation, null, 2);
  }
}
