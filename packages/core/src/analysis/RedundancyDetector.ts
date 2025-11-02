export interface RedundancyReport {
  component: string;
  similarComponents: Array<{
    name: string;
    similarity: number;
    sharedFunctionality: string[];
  }>;
  consolidationSuggestions: string[];
}

export class RedundancyDetector {
  private signatures: Map<string, Set<string>> = new Map();

  addComponent(componentName: string, functionalities: string[]): void {
    this.signatures.set(componentName, new Set(functionalities));
  }

  detectRedundancy(threshold: number = 0.5): RedundancyReport[] {
    const reports: RedundancyReport[] = [];

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

  private findSimilarComponents(
    component: string,
    functionality: Set<string>,
    threshold: number,
  ): RedundancyReport['similarComponents'] {
    const similarities: RedundancyReport['similarComponents'] = [];

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

  private calculateSimilarity(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  private getSharedFunctionality(set1: Set<string>, set2: Set<string>): string[] {
    return [...set1].filter(x => set2.has(x));
  }

  private generateSuggestions(component: string, similarities: RedundancyReport['similarComponents']): string[] {
    const suggestions: string[] = [];

    if (similarities.length === 1) {
      suggestions.push(`Consider merging ${component} with ${similarities[0].name}`);
    } else {
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
