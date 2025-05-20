import { Injectable } from '@nestjs/common';
import { A2AVersionManager } from './A2AVersionManager.js';
import Ajv from 'ajv';

@Injectable()
export class A2ASchemaValidator {
    private ajv: Ajv;
    private schemas: Map<string, object>;

    constructor(private versionManager: A2AVersionManager) {
        this.ajv = new Ajv({ allErrors: true });
        this.initializeSchemas();
    }

    private initializeSchemas() {
        this.schemas = new Map([
            ['2.0.0', {
                type: 'object',
                required: ['type', 'payload', 'metadata'],
                properties: {
                    type: { type: 'string' },
                    payload: { type: 'object' },
                    metadata: {
                        type: 'object',
                        required: ['timestamp', 'sender', 'protocol_version'],
                        properties: {
                            timestamp: { type: 'number' },
                            sender: { type: 'string' },
                            protocol_version: { type: 'string' },
                            schema: { type: 'string' }
                        }
                    }
                }
            }]
        ]);

        for (const [version, schema] of this.schemas) {
            this.ajv.addSchema(schema, `a2a-${version}`);
        }
    }

    async validateMessage(message: any): Promise<boolean> {
        const version = message.metadata?.protocol_version || '1.0.0';
        if (!this.versionManager.isVersionCompatible(version)) {
            throw new Error(`Unsupported protocol version: ${version}`);
        }

        const validate = this.ajv.getSchema(`a2a-${version}`);
        if (!validate) {
            throw new Error(`No schema found for version ${version}`);
        }

        if (!validate(message)) {
            throw new Error(`Invalid message format: ${this.ajv.errorsText(validate.errors)}`);
        }

        return true;
    }
}