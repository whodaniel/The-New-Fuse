import { Row, Column, CellValue, Table } from './types.js';
export declare const evaluateFormula: (formulaString: string, currentRow: Row, columns: Column[], currentTableRows: Row[], allTables: Table[]) => {
    value: CellValue | null;
    error?: string;
};
//# sourceMappingURL=formulaEvaluator.d.ts.map