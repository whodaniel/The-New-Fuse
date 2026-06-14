export interface ConfigUpdateTarget {
    file: string;
    type: 'vite' | 'package-json' | 'docker-compose' | 'env' | 'custom';
    serviceName: string;
    environment: string;
}
export declare class ConfigurationUpdater {
    private projectRoot;
    constructor(projectRoot: string);
    updateServiceConfiguration(): Promise<void>;
}
//# sourceMappingURL=config-updater.d.ts.map