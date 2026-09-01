import { AssemblyLine } from '../assembly/AssemblyLine';
import { SpecificationEngine } from '../assembly/SpecificationEngine';

describe('AssemblyLine', () => {
  it('rejects an empty objective before drafting', () => {
    const engine = new SpecificationEngine();
    expect(() => engine.createSpecification({ objective: '   ' })).toThrow(
      'Objective cannot be empty'
    );
  });

  it('produces a frozen specification with START and END nodes', () => {
    const spec = new SpecificationEngine().createSpecification({
      objective: 'Add a REST API health endpoint',
    });

    expect(spec.objective).toBe('Add a REST API health endpoint');
    expect(spec.acceptanceCriteria.length).toBeGreaterThan(0);
    expect(Object.isFrozen(spec)).toBe(true);
    const types = spec.workflowDefinition.nodes.map((n) => n.type);
    expect(types).toContain('start');
    expect(types).toContain('end');
    expect(types).toContain('agent_task');
  });

  it('runs specify → draft → verify without a relay Logger', async () => {
    const line = new AssemblyLine();
    const result = await line.run('Implement unit tests for the health endpoint');

    expect(result.specification.id).toMatch(/^spec-/);
    expect(result.draft.specificationId).toBe(result.specification.id);
    expect(result.draft.draftType).toBe('workflow');
    expect(typeof result.verification.passed).toBe('boolean');
    expect(result.verification.specificationId).toBe(result.specification.id);
  });
});
