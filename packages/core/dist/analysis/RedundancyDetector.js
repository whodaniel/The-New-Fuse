export class RedundancyDetector {
    constructor() {
        this.signatures = new Map();
    }
    addComponent(componentName, functionalities) {
        this.signatures.set(componentName, new Set(functionalities));
    }
    detectRedundancy(threshold = 0.5) {
        const reports = [];
        this.signatures.forEach((functionality, component) => {
            const similarities = this.findSimilarComponents(component, functionality, threshold);
            if (similarities.length > 0) {
                reports.push({
                    component,
                    similarComponents: similarities,
                    consolidationSuggestions: this.generateSuggestions(component, similarities),
                });
            }
        });
        return reports;
    }
    findSimilarComponents(component, functionality, threshold) {
        const similarities = [];
        this.signatures.forEach((otherFunctionality, otherComponent) => {
            if (component !== otherComponent) {
                const similarity = this.calculateSimilarity(functionality, otherFunctionality);
                if (similarity >= threshold) {
                    similarities.push({
                        name: otherComponent,
                        similarity,
                        sharedFunctionality: this.getSharedFunctionality(functionality, otherFunctionality),
                    });
                }
            }
        });
        return similarities;
    }
    calculateSimilarity(set1, set2) {
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return intersection.size / union.size;
    }
    getSharedFunctionality(set1, set2) {
        return [...set1].filter(x => set2.has(x));
    }
    generateSuggestions(component, similarities) {
        const suggestions = [];
        if (similarities.length === 1) {
            suggestions.push(`Consider merging ${component} with ${similarities[0].name}`);
        }
        else {
            suggestions.push(`Consider consolidating ${component} with ${similarities.map(s => s.name).join(', ')}`);
        }
        similarities.forEach(sim => {
            if (sim.sharedFunctionality.length > 0) {
                suggestions.push(`Extract shared functionality: ${sim.sharedFunctionality.join(', ')}`);
            }
        });
        return suggestions;
    }
}
//# sourceMappingURL=RedundancyDetector.js.map