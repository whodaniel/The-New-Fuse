
import { Row, Column, CellValue, DataType, Table, AttachmentFile } from './types';

// Very simple tokenizer - adjust regex for more complex scenarios
const tokenize = (formula: string): (string | number)[] => {
    // Regex to match field references like {Field Name}, numbers, operators, and strings
    // This is a simplified tokenizer. A more robust one would handle operator precedence, functions, etc.
    const tokenRegex = /({[^}]+})|(\d+\.?\d*)|([+\-*/&])|(".*?"|'.*?')/g;
    const tokens: (string|number)[] = [];
    let match;
    while ((match = tokenRegex.exec(formula)) !== null) {
        if (match[1]) tokens.push(match[1]); // Field reference {Field Name}
        else if (match[2]) tokens.push(parseFloat(match[2])); // Number
        else if (match[3]) tokens.push(match[3]); // Operator
        else if (match[4]) tokens.push(match[4].slice(1, -1)); // String literal (remove quotes)
    }
    return tokens;
};

const getColumnValue = (
    fieldName: string, 
    rowData: Row['data'], 
    columns: Column[],
    rows: Row[], // all rows in the current table for potential lookups (not used in this simple version)
    allTables: Table[] // all tables for potential cross-table lookups (not used in this simple version)
): CellValue | { error: string } => {
    const targetColumn = columns.find(col => col.name === fieldName);
    if (!targetColumn) {
        return { error: `Field "${fieldName}" not found.` };
    }
    
    let value = rowData[targetColumn.id];

    // Handle specific types for formula evaluation
    switch (targetColumn.type) {
        case DataType.NUMBER:
            const num = parseFloat(String(value)); // String(value) handles null/undefined gracefully for parseFloat
            return isNaN(num) ? null : num;
        case DataType.TEXT:
        case DataType.LONG_TEXT:
        case DataType.URL:
        case DataType.EMAIL: 
            if (value === null || value === undefined) return null;
            if (typeof value === 'string') return value;
            if (Array.isArray(value)) { 
                // Check if it's an array of AttachmentFile from a previous formula/lookup
                if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && 'name' in value[0] && 'id' in value[0] && 'type' in value[0]) {
                    return (value as AttachmentFile[]).map(f => f.name).join(', ');
                }
                return value.map(String).join(', ');
            }
            return String(value); // For boolean, number to be used as text
        case DataType.SINGLE_SELECT:
            if (typeof value === 'string' && targetColumn.options) { // value is optionId
                const option = targetColumn.options.find(o => o.id === value); // value is string, o.id is string.
                return option ? option.name : null; // Return option name for formula
            }
            return null; // If stored value isn't a string ID, it's invalid for select.
        case DataType.BOOLEAN:
            // For formulas, boolean true/false might be expected.
            // Consider if string "true"/"false" should be parsed. For now, strict.
            return typeof value === 'boolean' ? value : null; 
        case DataType.DATE:
        case DataType.CREATED_TIME:
        case DataType.LAST_MODIFIED_TIME:
             // For formulas, dates are often used in calculations (e.g. differences) or comparisons.
             // Returning as milliseconds (timestamp) is common for this.
             if (value instanceof Date) return value.getTime(); // Already a Date object
             if (typeof value === 'string') {
                 const dateVal = new Date(value);
                 return !isNaN(dateVal.getTime()) ? dateVal.getTime() : null;
             }
             if (typeof value === 'number') return value; // Already a timestamp
             return null;
        case DataType.ATTACHMENT:
             if(Array.isArray(value) && value.length > 0) {
                 // Return a comma-separated list of attachment names
                 return (value as AttachmentFile[]).map(f => f.name).join(', ');
             }
             return null;
        case DataType.LINKED_RECORD:
             if(Array.isArray(value) && value.length > 0 && targetColumn.linkedTableId && allTables) {
                 // This is a simplification. True lookups would fetch specific fields from linked records.
                 // For now, returning a comma-separated list of primary display values of linked records.
                 const linkedTable = allTables.find(t => t.id === targetColumn.linkedTableId);
                 if (linkedTable) {
                     const primaryColId = linkedTable.columnOrder[0];
                     const primaryCol = linkedTable.columns.find(c => c.id === primaryColId);
                     if (primaryCol) {
                        return (value as string[]).map(linkedId => {
                            const linkedRow = linkedTable.rows.find(r => r.id === linkedId);
                            return linkedRow ? String(linkedRow.data[primaryCol.id] ?? linkedId) : linkedId;
                        }).join(', ');
                     }
                 }
                 return (value as string[]).join(', '); // Fallback to IDs if lookup fails
             }
             return null;
        case DataType.FORMULA:
            // If a formula references another formula field, this could lead to recursion.
            // A robust system would detect cycles or use pre-calculated values.
            // For this simple evaluator, we're assuming direct field references are not other formulas
            // that need re-evaluation within this specific call of getColumnValue.
            // The value stored in rowData for a formula column should be its last computed value.
            return value; 
        default:
            // For unhandled types directly return the value.
            // The evaluation part will then try to use it.
            return value; 
    }
};


export const evaluateFormula = (
    formulaString: string, 
    currentRow: Row, 
    columns: Column[],
    currentTableRows: Row[],
    allTables: Table[]
): { value: CellValue | null; error?: string } => {
    if (!formulaString) return { value: null };

    const tokens = tokenize(formulaString.trim());
    if (tokens.length === 0) return { value: null };

    // This is a highly simplified infix to postfix or direct evaluation.
    // For this version, we'll try a very basic left-to-right evaluation for simple arithmetic/concatenation.
    // Example: {Price} * {Quantity} or {First Name} & " " & {Last Name}

    const RPNQueue: (CellValue | string)[] = []; // Using as a simple evaluation stack/queue
    const operatorStack: string[] = []; // Not a full Shunting-yard, basic op handling

    const precedence: {[key: string]: number} = { '+': 1, '-': 1, '*': 2, '/': 2, '&': 0 };

    for (const token of tokens) {
        if (typeof token === 'string' && token.startsWith('{') && token.endsWith('}')) {
            const fieldName = token.slice(1, -1);
            const colValResult = getColumnValue(fieldName, currentRow.data, columns, currentTableRows, allTables);
            if (typeof colValResult === 'object' && colValResult !== null && 'error' in colValResult) {
                 return { value: null, error: (colValResult as {error: string}).error };
            }
            RPNQueue.push(colValResult as CellValue); 
        } else if (typeof token === 'number' || (typeof token === 'string' && !precedence.hasOwnProperty(token))) { // Number or string literal
            RPNQueue.push(token);
        } else if (typeof token === 'string' && precedence.hasOwnProperty(token)) { // Operator
            // Simplified: assume left-to-right for now, pushing operators and operands
            // This doesn't handle precedence correctly for complex expressions like A + B * C
             while (
                operatorStack.length > 0 &&
                precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
            ) {
                RPNQueue.push(operatorStack.pop()!);
            }
            operatorStack.push(token);
        }
    }
    while(operatorStack.length > 0) {
        RPNQueue.push(operatorStack.pop()!);
    }

    // Evaluate the RPN (Simplified)
    const evalStack: CellValue[] = [];
    for (const item of RPNQueue) {
        if (typeof item === 'string' && ['+', '-', '*', '/', '&'].includes(item)) {
            const b_raw = evalStack.pop();
            const a_raw = evalStack.pop();

            if (a_raw === undefined || b_raw === undefined) return { value: null, error: "Syntax error in formula." };
            
            let valA = a_raw;
            let valB = b_raw;

            if (item === '&') { // String concatenation
                evalStack.push(String(valA ?? '') + String(valB ?? ''));
            } else { // Arithmetic
                // Attempt to convert to numbers for arithmetic
                valA = parseFloat(String(valA));
                valB = parseFloat(String(valB));

                if (isNaN(valA as number) || isNaN(valB as number)) {
                    // Allow operations if one is a number and other is null/undefined (treat as 0)
                    // but not if both are NaN after parseFloat from non-numeric strings
                     if ( (isNaN(valA as number) && a_raw !== null && a_raw !== undefined) || 
                          (isNaN(valB as number) && b_raw !== null && b_raw !== undefined) ) {
                        return { value: null, error: `Cannot perform arithmetic operation on non-numeric value.`};
                     }
                     valA = isNaN(valA as number) ? 0 : valA;
                     valB = isNaN(valB as number) ? 0 : valB;
                }
                if (item === '+') evalStack.push(valA + valB);
                else if (item === '-') evalStack.push(valA - valB);
                else if (item === '*') evalStack.push(valA * valB);
                else if (item === '/') {
                    if (valB === 0) return { value: null, error: "Division by zero." };
                    evalStack.push(valA / valB);
                }
            }
        } else {
            evalStack.push(item);
        }
    }

    if (evalStack.length !== 1) return { value: null, error: "Invalid formula structure." };
    
    // Final result from stack
    let finalValue = evalStack[0];

    // Post-evaluation type consistency (e.g. if a formula should always be number)
    // This is not strictly enforced here, depends on column's expected formula output type
    // For now, whatever the result is, is returned.
    return { value: finalValue };
};
