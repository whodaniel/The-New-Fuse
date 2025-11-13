/**
 * Hugging Face Adapter
 *
 * Adapter for models hosted on Hugging Face Inference Endpoints
 *
 * @module HuggingFaceAdapter
 * @since 2025-10-06
 */
import { BaseAdapter, AdapterExecutionResult } from './BaseAdapter';
import { MediaGenerationRequest } from '../GenerativeMediaProviderRegistry';
export declare class HuggingFaceAdapter extends BaseAdapter {
    private readonly baseURL;
    execute(request: MediaGenerationRequest): Promise<AdapterExecutionResult>;
}
//# sourceMappingURL=HuggingFaceAdapter.d.ts.map