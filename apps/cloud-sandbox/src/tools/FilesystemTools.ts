/**
 * Filesystem Tools
 *
 * Wrapped filesystem tools for file and directory operations.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ToolRegistry, ToolWrapper } from './ToolWrapper';

/**
 * Register all filesystem tools
 */
export function registerFilesystemTools(registry: ToolRegistry): void {
  // Read File
  registry.register(
    new ToolWrapper(
      {
        name: 'read_file',
        description: 'Read contents of a file',
        category: 'filesystem',
        riskLevel: 'medium',
        timeout: 10000,
        retryable: true,
        parameters: [
          {
            name: 'path',
            type: 'string',
            description: 'Path to the file',
            required: true,
            validation: (value) => {
              if (typeof value !== 'string') return false;
              // Prevent path traversal attacks
              const normalized = path.normalize(value as string);
              return !normalized.includes('..');
            },
          },
          {
            name: 'encoding',
            type: 'string',
            description: 'File encoding',
            required: false,
            default: 'utf8',
            enum: ['utf8', 'ascii', 'base64', 'binary'],
          },
        ],
        returns: {
          type: 'object',
          description: 'File contents and metadata',
        },
        examples: [
          {
            description: 'Read a text file',
            params: { path: '/tmp/example.txt', encoding: 'utf8' },
            expectedResult: {
              success: true,
              content: 'File contents...',
              size: 1024,
            },
          },
        ],
      },
      async (params) => {
        const filePath = params.path as string;
        const encoding = params.encoding as BufferEncoding;

        const content = await fs.readFile(filePath, encoding);
        const stats = await fs.stat(filePath);

        return {
          success: true,
          content,
          size: stats.size,
          path: filePath,
          modified: stats.mtime,
        };
      }
    )
  );

  // Write File
  registry.register(
    new ToolWrapper(
      {
        name: 'write_file',
        description: 'Write content to a file',
        category: 'filesystem',
        riskLevel: 'high',
        timeout: 10000,
        retryable: false,
        parameters: [
          {
            name: 'path',
            type: 'string',
            description: 'Path to the file',
            required: true,
            validation: (value) => {
              if (typeof value !== 'string') return false;
              const normalized = path.normalize(value as string);
              return !normalized.includes('..');
            },
          },
          {
            name: 'content',
            type: 'string',
            description: 'Content to write',
            required: true,
          },
          {
            name: 'encoding',
            type: 'string',
            description: 'File encoding',
            required: false,
            default: 'utf8',
            enum: ['utf8', 'ascii', 'base64', 'binary'],
          },
          {
            name: 'createDirectories',
            type: 'boolean',
            description: "Create parent directories if they don't exist",
            required: false,
            default: true,
          },
        ],
        returns: {
          type: 'object',
          description: 'Write result',
        },
      },
      async (params) => {
        const filePath = params.path as string;
        const content = params.content as string;
        const encoding = params.encoding as BufferEncoding;
        const createDirs = params.createDirectories as boolean;

        if (createDirs) {
          const dir = path.dirname(filePath);
          await fs.mkdir(dir, { recursive: true });
        }

        await fs.writeFile(filePath, content, encoding);
        const stats = await fs.stat(filePath);

        return {
          success: true,
          path: filePath,
          size: stats.size,
          written: true,
        };
      }
    )
  );

  // List Directory
  registry.register(
    new ToolWrapper(
      {
        name: 'list_directory',
        description: 'List files and directories in a path',
        category: 'filesystem',
        riskLevel: 'low',
        timeout: 5000,
        retryable: true,
        parameters: [
          {
            name: 'path',
            type: 'string',
            description: 'Directory path to list',
            required: true,
            validation: (value) => {
              if (typeof value !== 'string') return false;
              const normalized = path.normalize(value as string);
              return !normalized.includes('..');
            },
          },
          {
            name: 'recursive',
            type: 'boolean',
            description: 'List files recursively',
            required: false,
            default: false,
          },
        ],
        returns: {
          type: 'object',
          description: 'Directory listing',
        },
      },
      async (params) => {
        const dirPath = params.path as string;
        const recursive = params.recursive as boolean;

        if (recursive) {
          const files: string[] = [];
          const walk = async (dir: string) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);
              files.push(fullPath);
              if (entry.isDirectory()) {
                await walk(fullPath);
              }
            }
          };
          await walk(dirPath);
          return {
            success: true,
            path: dirPath,
            files,
            count: files.length,
          };
        } else {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          const files = entries.map((entry) => ({
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            path: path.join(dirPath, entry.name),
          }));

          return {
            success: true,
            path: dirPath,
            entries: files,
            count: files.length,
          };
        }
      }
    )
  );

  // Create Directory
  registry.register(
    new ToolWrapper(
      {
        name: 'create_directory',
        description: 'Create a directory',
        category: 'filesystem',
        riskLevel: 'medium',
        timeout: 5000,
        retryable: false,
        parameters: [
          {
            name: 'path',
            type: 'string',
            description: 'Directory path to create',
            required: true,
            validation: (value) => {
              if (typeof value !== 'string') return false;
              const normalized = path.normalize(value as string);
              return !normalized.includes('..');
            },
          },
          {
            name: 'recursive',
            type: 'boolean',
            description: "Create parent directories if they don't exist",
            required: false,
            default: true,
          },
        ],
        returns: {
          type: 'object',
          description: 'Creation result',
        },
      },
      async (params) => {
        const dirPath = params.path as string;
        const recursive = params.recursive as boolean;

        await fs.mkdir(dirPath, { recursive });

        return {
          success: true,
          path: dirPath,
          created: true,
        };
      }
    )
  );

  // Delete File
  registry.register(
    new ToolWrapper(
      {
        name: 'delete_file',
        description: 'Delete a file',
        category: 'filesystem',
        riskLevel: 'high',
        timeout: 5000,
        retryable: false,
        parameters: [
          {
            name: 'path',
            type: 'string',
            description: 'Path to file to delete',
            required: true,
            validation: (value) => {
              if (typeof value !== 'string') return false;
              const normalized = path.normalize(value as string);
              // Extra protection against deleting important files
              const dangerous = ['/etc/', '/bin/', '/usr/', '/sys/', '/proc/'];
              return !normalized.includes('..') && !dangerous.some((d) => normalized.startsWith(d));
            },
          },
        ],
        returns: {
          type: 'object',
          description: 'Deletion result',
        },
      },
      async (params) => {
        const filePath = params.path as string;
        const stats = await fs.stat(filePath);

        if (!stats.isFile()) {
          throw new Error(`Path is not a file: ${filePath}`);
        }

        await fs.unlink(filePath);

        return {
          success: true,
          path: filePath,
          deleted: true,
        };
      }
    )
  );

  // Copy File
  registry.register(
    new ToolWrapper(
      {
        name: 'copy_file',
        description: 'Copy a file to a new location',
        category: 'filesystem',
        riskLevel: 'medium',
        timeout: 10000,
        retryable: false,
        parameters: [
          {
            name: 'source',
            type: 'string',
            description: 'Source file path',
            required: true,
            validation: (value) => {
              if (typeof value !== 'string') return false;
              const normalized = path.normalize(value as string);
              return !normalized.includes('..');
            },
          },
          {
            name: 'destination',
            type: 'string',
            description: 'Destination file path',
            required: true,
            validation: (value) => {
              if (typeof value !== 'string') return false;
              const normalized = path.normalize(value as string);
              return !normalized.includes('..');
            },
          },
          {
            name: 'overwrite',
            type: 'boolean',
            description: 'Overwrite if destination exists',
            required: false,
            default: false,
          },
        ],
        returns: {
          type: 'object',
          description: 'Copy result',
        },
      },
      async (params) => {
        const source = params.source as string;
        const destination = params.destination as string;
        const overwrite = params.overwrite as boolean;

        const flags = overwrite ? 0 : fs.constants.COPYFILE_EXCL;
        await fs.copyFile(source, destination, flags);

        const stats = await fs.stat(destination);

        return {
          success: true,
          source,
          destination,
          size: stats.size,
          copied: true,
        };
      }
    )
  );

  // Get File Stats
  registry.register(
    new ToolWrapper(
      {
        name: 'file_stats',
        description: 'Get metadata about a file or directory',
        category: 'filesystem',
        riskLevel: 'low',
        timeout: 3000,
        retryable: true,
        parameters: [
          {
            name: 'path',
            type: 'string',
            description: 'File or directory path',
            required: true,
          },
        ],
        returns: {
          type: 'object',
          description: 'File statistics',
        },
      },
      async (params) => {
        const filePath = params.path as string;
        const stats = await fs.stat(filePath);

        return {
          success: true,
          path: filePath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          accessed: stats.atime,
          permissions: stats.mode.toString(8),
        };
      }
    )
  );
}
