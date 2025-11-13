/**
 * Direct API Adapter
 *
 * Adapter for providers with direct REST APIs (OpenAI, Recraft, etc.)
 *
 * @module DirectAPIAdapter
 * @since 2025-10-06
 */
import { BaseAdapter, AdapterExecutionResult } from './BaseAdapter';
import { MediaGenerationRequest } from '../GenerativeMediaProviderRegistry';
export declare class DirectAPIAdapter extends BaseAdapter {
    execute(request: MediaGenerationRequest): Promise<AdapterExecutionResult>;
}
//# sourceMappingURL=DirectAPIAdapter.d.ts.map