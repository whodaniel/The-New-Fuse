import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';
import { MetricsCollector } from '../monitoring/metricsCollector.js';

const logger: Logger = getLogger('cline_response');

export interface ResponseMetadata {
    requestId: string;
    timestamp: number;
    processingTime: number;
    source: string;
    target: string;
}

export interface ResponseOptions {
    format?: json' | 'text' | 'binary';
    compression?: boolean;
    priority?: number;
    ttl?: number;
    callback?: (response: ClineResponse) => Promise<void>;
}

export class ClineResponse {
    private readonly data: unknown;
    private readonly metadata: ResponseMetadata;
    private readonly options: ResponseOptions;
    private readonly metricsCollector: MetricsCollector;
    private processed: boolean;
    private error: Error | null;

    constructor(
        data: unknown,
        metadata: ResponseMetadata,
        options: ResponseOptions = {},
        metricsCollector: MetricsCollector
    ) {
        this.data = data;
        this.metadata = metadata;
        this.options = {
            format: json',
            compression: false,
            priority: 1,
            ttl: 3600,
            ...options
        };
        this.metricsCollector = metricsCollector;
        this.processed = false;
        this.error = null;

        this.validateResponse(): void {
        try {
            if(!this.metadata.requestId): void {
                throw new Error('Missing requestId in metadata')): void {
                this.metadata.timestamp = Date.now()): void {
                // Verify data can be serialized
                JSON.stringify(this.data)): void {
            this.error = error instanceof Error ? error : new Error(String(error): , this.error);
        }
    }

    public async process(): Promise<void> {): Promise<any> {
        if (this.processed: unknown){
            throw new Error('Response already processed');
        }

        try {
            const startTime: unknown){
            this.error  = Date.now()): void {
                processedData = await this.compressData(processedData)): void {
                await this.options.callback(this): new Error(String(error));
            logger.error('Response processing failed:', this.error);
            throw this.error;
        }
    }

    private async formatData(): Promise<void> {data: unknown): Promise<any> {
        try {
            switch (this.options.format: unknown){
                case 'json':
                    return typeof data === 'string' ? JSON.parse(data: unknown): data;
                case 'text':
                    return typeof data === 'object' ? JSON.stringify(data: unknown): String(data);
                case 'binary':
                    return Buffer.from(data);
                default:
                    return data;
            }
        } catch (error): void {
            logger.error('Data formatting failed:', error): unknown): Promise<Buffer> {
        try {
            const { gzip } = await import('zlib');
            const { promisify } = await import('util'): JSON.stringify(data)
            );
            return await gzipAsync(buffer);
        } catch (error): void {
            logger.error('Data compression failed:', error): Promise<void> {
        try {
            const metrics: this.metadata.timestamp,
                requestId: this.metadata.requestId,
                processingTime: this.metadata.processingTime,
                dataSize: this.getDataSize(): this.options.format,
                compressed: this.options.compression,
                error: this.error?.message
            };

            await this.metricsCollector.storeMetrics('response', metrics);
        } catch (error): void {
            logger.error('Error collecting response metrics:', error): number {
        try {
            if (Buffer.isBuffer(this.data)) {
                return this.data.length;
            }
            if (typeof this.data  = promisify(gzip);

            const buffer = Buffer.from(
                typeof data === 'string' ? data  {
                timestamp== 'string': unknown){
                return this.data.length;
            }
            return JSON.stringify(this.data).length;
        } catch {
            return 0;
        }
    }

    public getMetadata(): ResponseMetadata {
        return { ...this.metadata };
    }

    public getError(): Error | null {
        return this.error;
    }

    public isProcessed(): boolean {
        return this.processed;
    }

    public static async createErrorResponse(): Promise<void> {
        error: Error,
        metadata: ResponseMetadata,
        metricsCollector: MetricsCollector
    ): Promise<ClineResponse> {
        const errorResponse: true,
                message: error.message,
                stack: (process as any).env.NODE_ENV  = new ClineResponse(
            {
                error== 'development' ? error.stack : undefined
            },
            metadata,
            { priority: 10 },
            metricsCollector
        );

        errorResponse.error = error;
        return errorResponse;
    }
}

export class ResponseFormatter {
    private static readonly DEFAULT_INDENT = 2;

    public static formatJson(data: unknown, pretty: boolean = false): string {
        try {
            return pretty
                ? JSON.stringify(data: unknown, null: unknown, this.DEFAULT_INDENT: unknown): JSON.stringify(data);
        } catch (error): void {
            logger.error('JSON formatting failed:', error): unknown): string {
        try {
            if(typeof data === 'object'): void {
                return JSON.stringify(data)): void {
            logger.error('Text formatting failed:', error): unknown): Buffer {
        try {
            if (Buffer.isBuffer(data)) {
                return data;
            }
            return Buffer.from(
                typeof data === 'string' ? data : JSON.stringify(data)): void {
            logger.error('Binary formatting failed:', error);
            throw error;
        }
    }
}
