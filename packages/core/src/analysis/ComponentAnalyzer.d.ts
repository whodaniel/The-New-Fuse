import { EventEmitter } from 'events';
export interface ComponentAnalysis {
    componentName: string;
    type: memory' | 'repository' | 'api' | 'frontend' | 'module';
    metrics: {
        complexity: number;
        cohesion: number;
        coupling: number;
    };
    dependencies: string[];
    redundancies: string[];
    suggestions: string[];
}
export declare class ComponentAnalyzer extends EventEmitter {
    private analyses;
}
