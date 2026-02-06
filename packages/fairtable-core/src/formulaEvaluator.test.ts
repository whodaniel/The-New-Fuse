import { evaluateFormula } from './formulaEvaluator.js';
import { Column, DataType, Row, Table } from './types.js';

describe('evaluateFormula', () => {
  it('should evaluate a simple formula', () => {
    const columns: Column[] = [
      { id: 'col1', name: 'Price', type: DataType.NUMBER },
      { id: 'col2', name: 'Quantity', type: DataType.NUMBER },
    ];
    const currentRow: Row = {
      id: 'row1',
      data: { col1: 10, col2: 5 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId: null,
      depth: 0,
      isCollapsed: false,
    };
    const formulaString = '{Price} * {Quantity}';
    const allTables: Table[] = [];
    const result = evaluateFormula(formulaString, currentRow, columns, [], allTables);
    expect(result.value).toBe(50);
  });
});
