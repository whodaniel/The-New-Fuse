import { DraftGenerator, type DraftOutput } from './DraftGenerator';
import { SpecificationEngine, type TaskSpecification } from './SpecificationEngine';
import { VerificationGate, type VerificationResult } from './VerificationGate';

export interface AssemblyLineResult {
  readonly specification: TaskSpecification;
  readonly draft: DraftOutput;
  readonly verification: VerificationResult;
}

/**
 * Runs the three assembly-line phases in order: specify → draft → verify.
 * Fails closed when verification reports an error-severity finding.
 */
export class AssemblyLine {
  constructor(
    private readonly specificationEngine = new SpecificationEngine(),
    private readonly draftGenerator = new DraftGenerator(),
    private readonly verificationGate = new VerificationGate()
  ) {}

  async run(objective: string, context?: Record<string, unknown>): Promise<AssemblyLineResult> {
    const specification = this.specificationEngine.createSpecification({ objective, context });
    const draft = await this.draftGenerator.generateDraft({ specification });
    const verification = await this.verificationGate.verify({ specification, draft });
    return { specification, draft, verification };
  }
}
