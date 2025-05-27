"use strict";
/**
 * Example code file for testing AI collaboration features
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataProcessor = void 0;
exports.findDuplicates = findDuplicates;
// A simple function with some performance issues to optimize
function findDuplicates(array) {
    const duplicates = [];
    // Inefficient algorithm - O(n²) complexity
    for (let i = 0; i < array.length; i++) {
        for (let j = i + 1; j < array.length; j++) {
            if (array[i] === array[j] && !duplicates.includes(array[i])) {
                duplicates.push(array[i]);
            }
        }
    }
    return duplicates;
}
// Poorly documented class that needs improvement
class DataProcessor {
    constructor(initialData) {
        this.data = initialData;
    }
    process() {
        let result = [];
        for (let i = 0; i < this.data.length; i++) {
            let item = this.data[i];
            if (item && typeof item === 'object') {
                result.push({
                    id: item.id || Math.random().toString(36).substr(2, 9),
                    value: item.value,
                    processed: true,
                    timestamp: Date.now()
                });
            }
        }
        return result;
    }
    filter(predicate) {
        return this.data.filter(predicate);
    }
    transform(transformer) {
        return this.data.map(transformer);
    }
}
exports.DataProcessor = DataProcessor;
//# sourceMappingURL=example-code.js.map