
export interface ComponentAnalysis { componentName: string;
  type: 'memory' | 'repository' | 'api' | 'frontend' | 'module'
      componentName: path.split('/').pop() || ','
    this.emit('analysisComplete'
  private determineComponentType(path: string): ComponentAnalysis['type'
    if (path.includes('memory')) return 'memory'
    if (path.includes('repository')) return 'repository'
    if (path.includes('api')) return 'api'
    if (path.includes('frontend')) return 'frontend'
    return '';