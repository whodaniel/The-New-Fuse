export let testEnvironment: string;
export let rootDir: string;
export let testMatch: string[];
export let preset: string;
export let moduleFileExtensions: string[];
export let transform: {
    '^.+\\.tsx?$': string;
};
export let moduleNameMapping: {
    '^@/(.*)$': string;
    '^@advanced/(.*)$': string;
    '^@tests/(.*)$': string;
};
export let setupFilesAfterEnv: string[];
export let collectCoverage: boolean;
export let coverageDirectory: string;
export let coverageReporters: string[];
export let collectCoverageFrom: string[];
export let coverageThreshold: {
    global: {
        branches: number;
        functions: number;
        lines: number;
        statements: number;
    };
    './src/advanced/MCPOrchestrator.ts': {
        branches: number;
        functions: number;
        lines: number;
        statements: number;
    };
    './src/advanced/AdvancedBrowserAutomation.ts': {
        branches: number;
        functions: number;
        lines: number;
        statements: number;
    };
    './src/advanced/SecurityFramework.ts': {
        branches: number;
        functions: number;
        lines: number;
        statements: number;
    };
};
export let testTimeout: number;
export let verbose: boolean;
export let clearMocks: boolean;
export let restoreMocks: boolean;
export let errorOnDeprecated: boolean;
export let globals: {
    'ts-jest': {
        tsconfig: {
            compilerOptions: {
                module: string;
                target: string;
                lib: string[];
                moduleResolution: string;
                allowSyntheticDefaultImports: boolean;
                esModuleInterop: boolean;
                skipLibCheck: boolean;
                strict: boolean;
                resolveJsonModule: boolean;
                experimentalDecorators: boolean;
                emitDecoratorMetadata: boolean;
            };
        };
    };
};
export let reporters: (string | (string | {
    publicPath: string;
    filename: string;
    expand: boolean;
    hideIcon: boolean;
    pageTitle: string;
})[] | (string | {
    outputDirectory: string;
    outputName: string;
    ancestorSeparator: string;
    uniqueOutputName: string;
    suiteNameTemplate: string;
    classNameTemplate: string;
    titleTemplate: string;
})[])[];
export let watchman: boolean;
export let watchPathIgnorePatterns: string[];
export let maxWorkers: string;
export let mockPathIgnorePatterns: string[];
export let snapshotSerializers: never[];
export let testResultsProcessor: undefined;
export let testSequencer: string;
export let bail: boolean;
export let cache: boolean;
export let cacheDirectory: string;
export let dependencyExtractor: undefined;
export let forceExit: boolean;
export let detectOpenHandles: boolean;
export let detectLeakedTimers: boolean;
export let maxConcurrency: number;
export let notify: boolean;
export let notifyMode: string;
export let passWithNoTests: boolean;
export let prettierPath: string;
export let projects: undefined;
export let runner: string;
export let silent: boolean;
export let skipFilter: boolean;
export let slowTestThreshold: number;
export let testNamePattern: undefined;
export let testPathIgnorePatterns: string[];
export let testRunner: string;
export let transformIgnorePatterns: string[];
export let unmockedModulePathPatterns: undefined;
export let updateSnapshot: boolean;
export let useStderr: boolean;
export let watchPlugins: string[];
//# sourceMappingURL=jest.config.d.ts.map