"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GitTransactionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitTransactionService = void 0;
const common_1 = require("@nestjs/common");
const secure_subprocess_service_1 = require("./secure-subprocess.service");
let GitTransactionService = GitTransactionService_1 = class GitTransactionService {
    secureSubprocess;
    logger = new common_1.Logger(GitTransactionService_1.name);
    activeTransactions = new Map();
    auditTrail = [];
    AI_SIGNATURE = '🤖 Generated with [Claude Code](https://claude.ai/code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>';
    constructor(secureSubprocess) {
        this.secureSubprocess = secureSubprocess;
        this.logger.log('GitTransactionService initialized');
    }
    /**
     * Create a new AI change transaction
     */
    async createAITransaction(description, aiAgent, files, cwd) {
        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)};

    try {
      // Validate repository state
      await this.validateGitRepository(cwd);

      // Get current diff stats
      const diffStats = await this.calculateDiffStats(files, cwd);

      const transaction: GitTransaction = {
        id: transactionId,
        type: 'ai_change',
        description,
        aiAgent,
        files: [...files],
        timestamp: new Date(),
        status: 'pending',
        metadata: diffStats
      };

      this.activeTransactions.set(transactionId, transaction);
`;
        this.logger.log(Created, AI, transaction, $, { transactionId } ` by ${aiAgent}`);
        return transactionId;
    }
    catch(error) {
        this.logger.error(Failed, to, create, AI, transaction, $, { error });
        throw error;
    }
};
exports.GitTransactionService = GitTransactionService;
exports.GitTransactionService = GitTransactionService = GitTransactionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [secure_subprocess_service_1.SecureSubprocessService])
], GitTransactionService);
/**
 * Commit AI transaction with proper audit trail
 */
async;
commitAITransaction(transactionId, string, commitMessage ?  : string, cwd ?  : string);
Promise < string > {
    const: transaction = this.activeTransactions.get(transactionId),
    if(, transaction) {
        `
      throw new Error(Transaction not found: ${transactionId}`;
        ;
    },
    try: {
        // Stage all modified files
        for(, file, of, transaction) { }, : .files
    }
};
{
    await this.secureSubprocess.executeGitCommand(['add', file], { cwd });
}
// Check if there are actually changes to commit
const statusResult = await this.secureSubprocess.executeGitCommand(['status', '--porcelain'], { cwd });
if (!statusResult.stdout.trim()) {
    this.logger.warn(No, changes, to, commit);
    for (transaction; ; )
        : $;
    {
        transactionId;
    }
    `);
        transaction.status = 'failed';
        return '';
      }

      // Generate commit message with AI signature
      const fullCommitMessage = this.generateAICommitMessage(
        commitMessage || transaction.description,
        transaction.aiAgent!
      );

      // Create commit with heredoc to handle multi-line message
      const commitResult = await this.secureSubprocess.executeSecure('bash', ['-c',
        git commit -m "$(cat <<'EOF'\n${fullCommitMessage}\nEOF\n)"
      ], { cwd });

      if (commitResult.exitCode !== 0) {
        throw new Error(Git commit failed: ${commitResult.stderr});
      }

      // Get the commit hash
      const hashResult = await this.secureSubprocess.executeGitCommand(['rev-parse', 'HEAD'], { cwd });
      const commitHash = hashResult.stdout.trim();

      // Update transaction
      transaction.commitHash = commitHash;
      transaction.status = 'committed';

      // Create audit trail entry
      await this.createAuditTrailEntry(transaction, commitHash, cwd);` `
      this.logger.log(`;
    Committed;
    AI;
    transaction: $;
    {
        transactionId;
    }
    - > $;
    {
        commitHash;
    }
    ;
    return commitHash;
}
try { }
catch (error) {
    `
      transaction.status = 'failed';`;
    this.logger.error(Failed, to, commit, AI, transaction, $, { transactionId } `, error);
      throw error;
    }
  }

  /**
   * Create a rollback transaction
   */
  async rollbackTransaction(
    originalTransactionId: string,
    rollbackReason: string,
    cwd?: string
  ): Promise<string> {
    const originalTransaction = this.activeTransactions.get(originalTransactionId);
    if (!originalTransaction || !originalTransaction.commitHash) {
      throw new Error(Cannot rollback transaction: ${originalTransactionId});
    }

    try {`);
    const rollbackTransactionId = rollback_$, { Date, now };
    ();
}
`_${Math.random().toString(36).substr(2, 9)}`;
// Create revert commit
const revertResult = await this.secureSubprocess.executeGitCommand([
    'revert', '--no-edit', originalTransaction.commitHash
], { cwd });
if (revertResult.exitCode !== 0) {
    throw new Error(Git, revert, failed, $, { revertResult, : .stderr });
}
// Get the revert commit hash
const hashResult = await this.secureSubprocess.executeGitCommand(['rev-parse', 'HEAD'], { cwd });
const revertCommitHash = hashResult.stdout.trim();
// Create rollback transaction record
const rollbackTransaction = {
    id: rollbackTransactionId,
    type: 'rollback',
} `
        description: `, Rollback, { rollbackReason };
`,
        files: [...originalTransaction.files],
        timestamp: new Date(),
        commitHash: revertCommitHash,
        status: 'committed',
        metadata: {
          changedLines: originalTransaction.metadata.changedLines,
          addedFiles: 0,
          deletedFiles: 0,
          modifiedFiles: originalTransaction.files.length,
          diffSummary: Reverted changes from ${originalTransaction.commitHash}
        }
      };

      this.activeTransactions.set(rollbackTransactionId, rollbackTransaction);

      // Update original transaction status
      originalTransaction.status = 'rolled_back';
`;
this.logger.log(Rolled, back, transaction, $, { originalTransactionId } `` -  > $, { rollbackTransactionId });
return rollbackTransactionId;
try { }
catch (error) {
    `
      this.logger.error(Failed to rollback transaction: ${originalTransactionId}` `, error);
      throw error;
    }
  }

  /**
   * Get Git repository status and branch information
   */
  async getRepositoryStatus(cwd?: string): Promise<{
    branch: GitBranchInfo;
    staged: string[];
    modified: string[];
    untracked: string[];
    ahead: number;
    behind: number;
  }> {
    try {
      // Get current branch info
      const branchResult = await this.secureSubprocess.executeGitCommand(['branch', '--show-current'], { cwd });
      const currentBranch = branchResult.stdout.trim();

      // Get detailed status
      const statusResult = await this.secureSubprocess.executeGitCommand(['status', '--porcelain=v1'], { cwd });
      const statusLines = statusResult.stdout.trim().split('\n').filter(line => line);

      const staged: string[] = [];
      const modified: string[] = [];
      const untracked: string[] = [];

      for (const line of statusLines) {
        const status = line.substring(0, 2);
        const file = line.substring(3);

        if (status[0] !== ' ' && status[0] !== '?') {
          staged.push(file);
        }
        if (status[1] !== ' ' && status[1] !== '?') {
          modified.push(file);
        }
        if (status === '??') {
          untracked.push(file);
        }
      }

      // Get ahead/behind info
      const trackingResult = await this.secureSubprocess.executeGitCommand([
        'status', '--porcelain=v2', '--branch'
      ], { cwd });

      let ahead = 0;
      let behind = 0;

      const branchLine = trackingResult.stdout.split('\n').find(line => line.startsWith('# branch.ab'));
      if (branchLine) {
        const match = branchLine.match(/# branch\.ab \+(\d+) -(\d+)/);
        if (match) {
          ahead = parseInt(match[1]);
          behind = parseInt(match[2]);
        }
      }

      // Get current commit hash
      const commitResult = await this.secureSubprocess.executeGitCommand(['rev-parse', 'HEAD'], { cwd });
      const commit = commitResult.stdout.trim();

      return {
        branch: {
          name: currentBranch,
          commit,
          ahead,
          behind
        },
        staged,
        modified,
        untracked,
        ahead,
        behind
      };

    } catch (error) {
      this.logger.error('Failed to get repository status', error);
      throw error;
    }
  }

  /**
   * Get AI audit trail for the repository
   */
  async getAIAuditTrail(limit: number = 50, cwd?: string): Promise<GitAuditTrail[]> {
    try {
      // Get recent commits with AI signature
      const logResult = await this.secureSubprocess.executeGitCommand([
        'log', '--oneline', '--grep=Generated with.*Claude Code', -${limit}, '--reverse'
      ], { cwd });

      const auditEntries: GitAuditTrail[] = [];

      for (const line of logResult.stdout.trim().split('\n')) {
        if (!line) continue;

        const [commitHash, ...messageParts] = line.split(' ');
        const message = messageParts.join(' ');

        // Get detailed commit info
        const detailResult = await this.secureSubprocess.executeGitCommand([
          'show', '--name-status', '--format=fuller', commitHash
        ], { cwd });

        const auditEntry = this.parseCommitForAudit(commitHash, detailResult.stdout);
        if (auditEntry) {
          auditEntries.push(auditEntry);
        }
      }

      return auditEntries;

    } catch (error) {
      this.logger.error('Failed to get AI audit trail', error);
      throw error;
    }
  }

  /**
   * Generate diff summary for transaction
   */
  async generateDiffSummary(files: string[], cwd?: string): Promise<string> {
    try {
      const diffResult = await this.secureSubprocess.executeGitCommand([
        'diff', '--stat', ...files
      ], { cwd });

      return diffResult.stdout || 'No changes detected';

    } catch (error) {
      this.logger.error('Failed to generate diff summary', error);
      return 'Error generating diff summary';
    }
  }

  /**
   * Get transaction by ID
   */
  getTransaction(transactionId: string): GitTransaction | null {
    return this.activeTransactions.get(transactionId) || null;
  }

  /**
   * Get all active transactions
   */
  getActiveTransactions(): GitTransaction[] {
    return Array.from(this.activeTransactions.values());
  }

  /**
   * Get AI-generated commits count
   */
  async getAICommitsCount(cwd?: string): Promise<number> {
    try {
      const result = await this.secureSubprocess.executeGitCommand([
        'log', '--oneline', '--grep=Generated with.*Claude Code'
      ], { cwd });

      return result.stdout.trim().split('\n').filter(line => line).length;

    } catch (error) {
      this.logger.error('Failed to count AI commits', error);
      return 0;
    }
  }

  /**
   * Private helper methods
   */

  private async validateGitRepository(cwd?: string): Promise<void> {
    try {
      const result = await this.secureSubprocess.executeGitCommand(['rev-parse', '--git-dir'], { cwd });
      if (result.exitCode !== 0) {
        throw new Error('Not a Git repository');
      }
    } catch (error) {`;
    throw new Error(`Invalid Git repository: ${error}`);
}
async;
calculateDiffStats(files, string[], cwd ?  : string);
Promise < GitTransaction['metadata'] > {
    try: {
        let, changedLines = 0,
        let, addedFiles = 0,
        let, deletedFiles = 0,
        let, modifiedFiles = 0,
        // Get status of each file
        for(, file, of, files) {
            try {
                const statusResult = await this.secureSubprocess.executeGitCommand(['status', '--porcelain', file], { cwd });
                const status = statusResult.stdout.trim();
                if (status) {
                    const statusCode = status.substring(0, 2).trim();
                    if (statusCode === 'A' || statusCode === '??') {
                        addedFiles++;
                    }
                    else if (statusCode === 'D') {
                        deletedFiles++;
                    }
                    else if (statusCode === 'M') {
                        modifiedFiles++;
                    }
                    // Get line changes for existing files
                    if (statusCode === 'M') {
                        try {
                            const diffResult = await this.secureSubprocess.executeGitCommand(['diff', '--numstat', file], { cwd });
                            const match = diffResult.stdout.match(/^(\d+)\s+(\d+)/);
                            if (match) {
                                changedLines += parseInt(match[1]) + parseInt(match[2]);
                            }
                        }
                        catch {
                            // Ignore diff errors for individual files
                        }
                    }
                }
            }
            catch {
                // Ignore errors for individual files
            }
        },
        const: diffSummary = await this.generateDiffSummary(files, cwd),
        return: {
            changedLines,
            addedFiles,
            deletedFiles,
            modifiedFiles,
            diffSummary
        }
    }, catch(error) {
        this.logger.error('Failed to calculate diff stats', error);
        return {
            changedLines: 0,
            addedFiles: 0,
            deletedFiles: 0,
            modifiedFiles: files.length,
            diffSummary: 'Error calculating statistics'
        };
    }
};
generateAICommitMessage(description, string, aiAgent, string);
string;
{
    return $;
    {
        description;
    }
    `
${this.AI_SIGNATURE}`;
}
async;
createAuditTrailEntry(transaction, GitTransaction, commitHash, string, cwd ?  : string);
Promise < void  > {
    try: {
        // Get commit details
        const: showResult = await this.secureSubprocess.executeGitCommand([
            'show', '--name-status', '--format=fuller', commitHash
        ], { cwd }),
        const: auditEntry = this.parseCommitForAudit(commitHash, showResult.stdout),
        if(auditEntry) {
            auditEntry.transactionId = transaction.id;
            this.auditTrail.push(auditEntry);
        }
    }, catch(error) {
        this.logger.error('Failed to create audit trail entry', error);
    }
};
parseCommitForAudit(commitHash, string, commitOutput, string);
GitAuditTrail | null;
{
    try {
        const lines = commitOutput.split('\n');
        let author = '';
        let date = new Date();
        let message = '';
        let aiGenerated = false;
        const files = [];
        // Parse commit header
        for (const line of lines) {
            if (line.startsWith('Author:')) {
                author = line.replace('Author:', '').trim();
            }
            else if (line.startsWith('AuthorDate:')) {
                date = new Date(line.replace('AuthorDate:', '').trim());
            }
            else if (line.includes('Generated with') && line.includes('Claude Code')) {
                aiGenerated = true;
            }
        }
        // Extract commit message (first non-empty line after headers)
        let messageStarted = false;
        for (const line of lines) {
            if (messageStarted && line.trim()) {
                message = line.trim();
                break;
            }
            if (line.trim() === '' && !messageStarted) {
                messageStarted = true;
            }
        }
        // Parse file changes
        for (const line of lines) {
            if (line.match(/^[ADM]\s+/)) {
                const parts = line.split('\t');
                const status = parts[0];
                const filePath = parts[1];
                files.push({
                    path: filePath,
                    status: status === 'A' ? 'added' : status === 'D' ? 'deleted' : 'modified',
                    linesAdded: 0, // Would need detailed diff for this
                    linesDeleted: 0
                });
            }
        }
        return {
            transactionId: '',
            commitHash,
            author,
            date,
            message,
            files,
            aiGenerated
        };
    }
    catch (error) {
        this.logger.error('Failed to parse commit for audit', error);
        return null;
    }
}
//# sourceMappingURL=git-transaction.service.js.map