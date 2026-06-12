import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const execPromise = promisify(exec);

export const PROJECT_ROOT = path.resolve(__dirname, '../../'); // Adjust as needed for project root

export const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'cleanup-backups',
  'reports',
  'test-results',
  'playwright-report',
  '.turbo',
];

/**
 * Finds files matching given patterns, excluding specified directories.
 * @param {string[]} patterns - Array of file name patterns (e.g., "*.ts", "*.js").
 * @param {string[]} [excludeDirs=EXCLUDE_DIRS] - Directories to exclude.
 * @param {string} [rootDir=PROJECT_ROOT] - Root directory to start the search from.
 * @returns {Promise<string[]>} - A promise that resolves to an array of file paths.
 */
export async function findFiles(patterns, excludeDirs = EXCLUDE_DIRS, rootDir = PROJECT_ROOT) {
  const excludeFlags = excludeDirs.map((dir) => `-not -path "${rootDir}/**/${dir}/*"`).join(' ');
  const namePatterns = patterns.map((pattern) => `-name "${pattern}"`).join(' -o ');
  const command = `find "${rootDir}" ${excludeFlags} -type f \( ${namePatterns} \)`;
  try {
    const { stdout } = await execPromise(command, { cwd: rootDir });
    return stdout.split('\n').filter(Boolean);
  } catch (error) {
    console.error(`Error finding files with patterns ${patterns.join(', ')}:`, error);
    return [];
  }
}

/**
 * Greps for a pattern in files, with optional include/exclude patterns and directories.
 * @param {string} searchPattern - The pattern to search for.
 * @param {string[]} [includePatterns=[]] - File patterns to include (e.g., "*.ts", "*.tsx").
 * @param {string[]} [excludeDirs=EXCLUDE_DIRS] - Directories to exclude.
 * @param {string} [rootDir=PROJECT_ROOT] - Root directory to start the search from.
 * @returns {Promise<string>} - A promise that resolves to the grep output.
 */
export async function grepFiles(
  searchPattern,
  includePatterns = [],
  excludeDirs = EXCLUDE_DIRS,
  rootDir = PROJECT_ROOT
) {
  const excludeFlags = excludeDirs.map((dir) => `--exclude-dir=${dir}`).join(' ');
  const includeFlags = includePatterns.map((pattern) => `--include=${pattern}`).join(' ');
  const command = `grep -r "${searchPattern}" "${rootDir}" ${includeFlags} ${excludeFlags} || true`;
  try {
    const { stdout } = await execPromise(command, { cwd: rootDir });
    return stdout;
  } catch (error) {
    console.error(`Error grepping for "${searchPattern}":`, error);
    return '';
  }
}

/**
 * Gets the line count of a given file.
 * @param {string} filePath - Path to the file.
 * @param {string} [rootDir=PROJECT_ROOT] - Root directory for command execution.
 * @returns {Promise<number>} - A promise that resolves to the line count, or 0 if an error occurs.
 */
export async function getFileLineCount(filePath, rootDir = PROJECT_ROOT) {
  try {
    const { stdout } = await execPromise(`wc -l "${filePath}"`, { cwd: rootDir });
    return parseInt(stdout.trim().split(' ')[0], 10);
  } catch (error) {
    console.error(`Error getting line count for ${filePath}:`, error);
    return 0;
  }
}

/**
 * Gets the last modification date of a file from git history.
 * @param {string} filePath - Path to the file.
 * @param {string} [rootDir=PROJECT_ROOT] - Root directory for command execution.
 * @returns {Promise<Date | null>} - A promise that resolves to a Date object, or null if an error occurs.
 */
export async function getGitLastModifiedDate(filePath, rootDir = PROJECT_ROOT) {
  try {
    const { stdout } = await execPromise(`git log -1 --format=%cd "${filePath}"`, { cwd: rootDir });
    const dateString = stdout.trim();
    return dateString ? new Date(dateString) : null;
  } catch (error) {
    console.error(`Error getting git last modified date for ${filePath}:`, error);
    return null;
  }
}
