/**
 * Replicate Adapter
 *
 * Adapter for models hosted on Replicate platform (FLUX, etc.)
 *
 * @module ReplicateAdapter
 * @since 2025-10-06
 */
import { BaseAdapter, AdapterExecutionResult } from './BaseAdapter';
import { MediaGenerationRequest } from '../GenerativeMediaProviderRegistry';
export declare class ReplicateAdapter extends BaseAdapter {
    private readonly baseURL;
    execute(request: MediaGenerationRequest): Promise<AdapterExecutionResult>;
}
//# sourceMappingURL=ReplicateAdapter.d.ts.map