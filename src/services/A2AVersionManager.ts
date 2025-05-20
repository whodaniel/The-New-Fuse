import { Injectable } from '@nestjs/common';
import { A2ALogger } from './A2ALogger.js';
import semver from 'semver';

@Injectable()
export class A2AVersionManager {
    private readonly supportedVersions = ['1.0.0', '1.1.0', '2.0.0'];
    private readonly currentVersion = '2.0.0';

    constructor(private logger: A2ALogger) {}

    isVersionCompatible(version: string): boolean {
        return this.supportedVersions.some(v => semver.satisfies(version, v));
    }

    async transformMessageToVersion(message: any, targetVersion: string): Promise<any> {
        const sourceVersion = message.metadata?.protocol_version || '1.0.0';
        
        if (sourceVersion === targetVersion) {
            return message;
        }

        const transformer = this.getVersionTransformer(sourceVersion, targetVersion);
        return transformer(message);
    }

    private getVersionTransformer(from: string, to: string) {
        const transformers = {
            '1.0.0->1.1.0': this.transform_1_0_to_1_1,
            '1.1.0->2.0.0': this.transform_1_1_to_2_0
        };

        const key = `${from}->${to}`;
        return transformers[key] || (message => message);
    }

    private transform_1_0_to_1_1(message: any): any {
        return {
            ...message,
            metadata: {
                ...message.metadata,
                protocol_version: '1.1.0',
                capabilities: []
            }
        };
    }

    private transform_1_1_to_2_0(message: any): any {
        return {
            ...message,
            metadata: {
                ...message.metadata,
                protocol_version: '2.0.0',
                schema: 'https://a2a.protocol.dev/schema/v2'
            }
        };
    }
}