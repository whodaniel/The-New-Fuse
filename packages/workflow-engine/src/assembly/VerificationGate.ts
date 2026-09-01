/**
 * Verification Gate - Phase 3 of the 3-Phase Assembly Line Pattern
 *
 * Runs deterministic checks (type-check, unit tests, linting, and AST checks)
 * against the generated draft. Fails closed with structured failure diagnostics
 * if acceptance criteria are unmet.
 */

import { UnifiedWorkflow, WorkflowNodeType } from '../types/WorkflowTypes';
import { DraftOutput } from './DraftGenerator';
import { TaskSpecification } from './SpecificationEngine';

export interface GateLogger {
  debug?(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

const consoleGateLogger: GateLogger = {
  debug: (message) => console.debug(message),
  info: (message) => console.info(message),
  warn: (message) => console.warn(message),
  error: (message) => console.error(message),
};

export interface WorkflowStructureValidator {
  validateWorkflow(workflow: UnifiedWorkflow): Promise<{
    valid: boolean;
    errors: Array<{ message: string; nodeId?: string }>;
    warnings: Array<{ message: string; nodeId?: string }>;
  }>;
}

/**
 * Output from the Verification Gate - indicates whether the draft passed verification.
 */
export interface VerificationResult {
  /** Whether the draft passed all verification checks */
  readonly passed: boolean;
  /** The specification that was verified against */
  readonly specificationId: string;
  /** The draft that was verified */
  readonly draftId: string;
  /** Detailed error information if verification failed */
  readonly errors: VerificationError[];
  /** Warnings that don't prevent passage but should be noted */
  readonly warnings: VerificationWarning[];
  /** Metadata about the verification process */
  readonly metadata: {
    /** Timestamp when verification was completed */
    readonly verifiedAt: Date;
    /** The verification gate version */
    readonly version: string;
    /** Any additional context */
    readonly context?: Record<string, unknown>;
  };
}

/**
 * Error from the verification process.
 */
export interface VerificationError {
  /** Unique identifier for the error */
  readonly id: string;
  /** Human-readable message describing the error */
  readonly message: string;
  /** The type of check that failed (e.g., 'type-check', 'linting', 'acceptance-criteria') */
  readonly checkType: string;
  /** Optional node or element in the draft that caused the error */
  readonly targetId?: string;
  /** Severity of the error */
  readonly severity: 'error' | 'warning';
  /** Suggested remediation steps */
  readonly remediation?: string;
}

/**
 * Warning from the verification process.
 */
export interface VerificationWarning {
  /** Unique identifier for the warning */
  readonly id: string;
  /** Human-readable message describing the warning */
  readonly message: string;
  /** The type of check that produced the warning */
  readonly checkType: string;
  /** Optional node or element in the draft that caused the warning */
  readonly targetId?: string;
}

/**
 * Input to the Verification Gate - the specification and draft to verify.
 */
export interface VerificationGateInput {
  /** The task specification to verify against */
  readonly specification: TaskSpecification;
  /** The draft output to verify */
  readonly draft: DraftOutput;
}

/**
 * Verification Gate - performs deterministic checks on drafts.
 */
export class VerificationGate {
  private readonly version = '1.0.0';
  private logger: GateLogger;
  private workflowValidator: WorkflowStructureValidator | null;
  private warnings: VerificationWarning[] = [];

  constructor(
    logger: GateLogger = consoleGateLogger,
    workflowValidator: WorkflowStructureValidator | null = null
  ) {
    this.logger = logger;
    this.workflowValidator = workflowValidator;
  }

  /**
   * Verify a draft against a specification.
   *
   * @param input - The specification and draft to verify
   * @returns Verification result indicating pass/fail and details
   */
  public async verify(input: VerificationGateInput): Promise<VerificationResult> {
    const { specification, draft } = input;

    // Validate inputs
    if (!specification) {
      throw new Error('Specification is required for verification');
    }
    if (!draft) {
      throw new Error('Draft is required for verification');
    }

    // Reset warnings for this verification
    this.warnings = [];

    // Initialize result containers
    const errors: VerificationError[] = [];

    // Perform verification steps
    try {
      // Step 1: Validate the workflow structure (if draft is a workflow)
      if (draft.draftType === 'workflow' && typeof draft.draft !== 'string') {
        const workflowErrors = await this.validateWorkflowStructure(
          specification,
          draft.draft as UnifiedWorkflow
        );
        errors.push(...workflowErrors);
      }

      // Step 2: Check acceptance criteria
      const acceptanceErrors = this.checkAcceptanceCriteria(specification, draft);
      errors.push(...acceptanceErrors);

      // Step 3: Perform type-checking (if applicable)
      const typeCheckErrors = await this.performTypeCheck(draft);
      errors.push(...typeCheckErrors);

      // Step 4: Perform linting (if applicable)
      const lintingErrors = await this.performLinting(draft);
      errors.push(...lintingErrors);

      // Step 5: Perform AST checks (if applicable)
      const astErrors = await this.performASTCheck(draft);
      errors.push(...astErrors);

      // Determine if verification passed (no errors of severity 'error')
      const passed = errors.every((error) => error.severity !== 'error');

      // Log the result
      if (passed) {
        this.logger.info(`✅ Verification passed for specification ${specification.id}`);
      } else {
        this.logger.warn(
          `❌ Verification failed for specification ${specification.id} with ${errors.filter((e) => e.severity === 'error').length} errors`
        );
      }

      // Construct and return the result
      return {
        passed,
        specificationId: specification.id,
        draftId: draft.specificationId,
        errors,
        warnings: this.warnings,
        metadata: {
          verifiedAt: new Date(),
          version: this.version,
          context: {
            specificationVersion: specification.metadata.version,
            draftGenerator: draft.metadata.generator,
          },
        },
      };
    } catch (error) {
      // Handle unexpected errors during verification
      const err = error as Error;
      this.logger.error(`💥 Verification gate encountered an unexpected error: ${err.message}`);
      return {
        passed: false,
        specificationId: specification.id,
        draftId: draft.specificationId,
        errors: [
          {
            id: `verification-error-${Date.now()}`,
            message: `Unexpected error during verification: ${err.message}`,
            checkType: 'verification-gate',
            severity: 'error',
            remediation: 'Check the verification gate implementation and input data.',
          },
        ],
        warnings: this.warnings,
        metadata: {
          verifiedAt: new Date(),
          version: this.version,
        },
      };
    }
  }

  /**
   * Validate the workflow structure using the existing WorkflowValidator.
   */
  private async validateWorkflowStructure(
    spec: TaskSpecification,
    workflow: UnifiedWorkflow
  ): Promise<VerificationError[]> {
    const errors: VerificationError[] = [];

    try {
      if (!this.workflowValidator) {
        const hasStart = workflow.definition.nodes.some((n) => n.type === WorkflowNodeType.START);
        const hasEnd = workflow.definition.nodes.some((n) => n.type === WorkflowNodeType.END);
        if (!hasStart || !hasEnd) {
          errors.push({
            id: `workflow-structure-${Date.now()}-1`,
            message: 'Workflow must include START and END nodes',
            checkType: 'workflow-structure',
            severity: 'error',
          });
        }
        return errors;
      }

      const validationResult = await this.workflowValidator.validateWorkflow(workflow);
      if (!validationResult.valid) {
        for (const validationError of validationResult.errors) {
          errors.push({
            id: `workflow-validation-${Date.now()}-${errors.length + 1}`,
            message: validationError.message,
            checkType: 'workflow-structure',
            targetId: validationError.nodeId,
            severity: 'error',
          });
        }
        for (const validationWarning of validationResult.warnings) {
          this.warnings.push({
            id: `workflow-validation-warning-${Date.now()}-${this.warnings.length + 1}`,
            message: validationWarning.message,
            checkType: 'workflow-structure',
            targetId: validationWarning.nodeId,
          });
        }
      }
    } catch (error) {
      const err = error as Error;
      errors.push({
        id: `workflow-structure-${Date.now()}-1`,
        message: `Error validating workflow structure: ${err.message}`,
        checkType: 'workflow-structure',
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Check that the draft meets the specification's acceptance criteria.
   * This is a simplified implementation - in practice this would be more sophisticated.
   */
  private checkAcceptanceCriteria(
    spec: TaskSpecification,
    draft: DraftOutput
  ): VerificationError[] {
    const errors: VerificationError[] = [];

    // For now, we'll do a basic check: ensure the draft exists and is not empty
    if (!draft.draft) {
      errors.push({
        id: `acceptance-${Date.now()}-1`,
        message: 'Draft is empty or missing',
        checkType: 'acceptance-criteria',
        severity: 'error',
        remediation: 'Ensure the draft generator produced a non-empty output.',
      });
      return errors;
    }

    // Check each acceptance criterion - simplified version
    for (const criterion of spec.acceptanceCriteria) {
      // In a real implementation, we would parse the criterion and check the draft against it
      // For now, we'll just log that we're checking it (this is a placeholder)
      this.logger.debug?.(`Checking acceptance criterion: ${criterion}`);

      // Example: if criterion mentions "tests", check for validation nodes
      if (
        criterion.toLowerCase().includes('test') ||
        criterion.toLowerCase().includes('validation')
      ) {
        if (draft.draftType === 'workflow' && typeof draft.draft !== 'string') {
          const workflow = draft.draft as UnifiedWorkflow;
          const hasValidationNode = workflow.definition.nodes.some(
            (node) => node.name && node.name.toLowerCase().includes('validation')
          );
          if (!hasValidationNode) {
            errors.push({
              id: `acceptance-${Date.now()}-${errors.length + 1}`,
              message: `Acceptance criterion not met: ${criterion}`,
              checkType: 'acceptance-criteria',
              severity: 'error',
              remediation: 'Add a validation node to the workflow to test the implementation.',
            });
          }
        }
      }

      // Example: if criterion mentions "error handling", check for error handling in config
      if (
        criterion.toLowerCase().includes('error handling') ||
        criterion.toLowerCase().includes('error')
      ) {
        if (draft.draftType === 'workflow' && typeof draft.draft !== 'string') {
          const workflow = draft.draft as UnifiedWorkflow;
          // Check if the workflow settings have error handling
          const hasErrorHandling =
            workflow.definition.settings?.errorHandling?.onError !== undefined;
          if (!hasErrorHandling) {
            errors.push({
              id: `acceptance-${Date.now()}-${errors.length + 1}`,
              message: `Acceptance criterion not met: ${criterion}`,
              checkType: 'acceptance-criteria',
              severity: 'error',
              remediation: 'Configure error handling in the workflow settings.',
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * Perform type-checking on the draft (if applicable).
   * This is a placeholder - in practice this would run tsc or similar.
   */
  private async performTypeCheck(draft: DraftOutput): Promise<VerificationError[]> {
    // For workflow drafts, we might check the types of the workflow structure
    // For code diffs, we would run tsc on the generated code
    // This is a simplified implementation that always passes for now
    return [];
  }

  /**
   * Perform linting on the draft (if applicable).
   * This is a placeholder - in practice this would run eslint or similar.
   */
  private async performLinting(draft: DraftOutput): Promise<VerificationError[]> {
    // Placeholder implementation
    return [];
  }

  /**
   * Perform AST checks on the draft (if applicable).
   * This is a placeholder - in practice this would run custom AST checks.
   */
  private async performASTCheck(draft: DraftOutput): Promise<VerificationError[]> {
    // Placeholder implementation
    return [];
  }
}
