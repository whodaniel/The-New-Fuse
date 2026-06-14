import { evaluateFormula } from './formulaEvaluator.js';
import { DataType } from './types.js';
describe('evaluateFormula', () => {
    it('should evaluate a simple formula', () => {
        const columns = [
            { id: 'col1', name: 'Price', type: DataType.NUMBER },
            { id: 'col2', name: 'Quantity', type: DataType.NUMBER },
        ];
        const currentRow = {
            id: 'row1',
            data: { col1: 10, col2: 5 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parentId: null,
            depth: 0,
            isCollapsed: false,
        };
        const formulaString = '{Price} * {Quantity}';
        const allTables = [];
        const result = evaluateFormula(formulaString, currentRow, columns, [], allTables);
        expect(result.value).toBe(50);
    });
});
//# sourceMappingURL=formulaEvaluator.test.js.map