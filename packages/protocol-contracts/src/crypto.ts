import { z } from 'zod';

/**
 * ============================================================================
 * ENSO DEFI OPERATIONS (7.0 Crypto Operations Division)
 * ============================================================================
 */

export const EnsoDeFiInputSchema = z
  .object({
    operation_type: z
      .enum(['swap', 'stake', 'bridge', 'withdraw', 'compound'])
      .describe('The type of DeFi operation to perform'),
    token_in: z.string().describe("Token symbol or address to use as input (e.g., 'ETH', 'USDC')"),
    amount: z.string().describe('Amount to operate on (as string to preserve precision)'),
    token_out: z.string().optional().describe('For swaps: output token symbol or address'),
    chain_from: z.string().optional().describe('For bridges: source blockchain'),
    chain_to: z.string().optional().describe('For bridges: destination blockchain'),
    strategy: z
      .enum(['highest_yield', 'lowest_risk', 'balanced'])
      .default('highest_yield')
      .describe('For staking: yield optimization strategy'),
    slippage_tolerance: z
      .number()
      .min(0)
      .max(5)
      .default(0.5)
      .describe('Maximum acceptable slippage in percent'),
    gas_priority: z
      .enum(['low', 'medium', 'high'])
      .default('medium')
      .describe('Gas price priority'),
  })
  .strict();

export type EnsoDeFiInput = z.infer<typeof EnsoDeFiInputSchema>;

export const TokenSwapInputSchema = z
  .object({
    from_token: z.string().describe('Token to swap from'),
    to_token: z.string().describe('Token to swap to'),
    amount: z.string().describe('Amount to swap'),
    min_output: z.string().optional().describe('Minimum acceptable output amount'),
    slippage_tolerance: z.number().min(0).max(5).default(0.5),
  })
  .strict();

export type TokenSwapInput = z.infer<typeof TokenSwapInputSchema>;

export const YieldStakingInputSchema = z
  .object({
    token: z.string().describe('Token to stake'),
    amount: z.string().describe('Amount to stake'),
    min_apy: z.number().min(0).max(100).optional().describe('Minimum acceptable APY'),
    lock_period: z.number().min(0).optional().describe('Lock period in days (0 for flexible)'),
    strategy: z.enum(['highest_yield', 'lowest_risk', 'balanced']).default('highest_yield'),
  })
  .strict();

export type YieldStakingInput = z.infer<typeof YieldStakingInputSchema>;

export const CrossChainBridgeInputSchema = z
  .object({
    token: z.string().describe('Token to bridge'),
    amount: z.string().describe('Amount to bridge'),
    from_chain: z.string().describe('Source blockchain'),
    to_chain: z.string().describe('Destination blockchain'),
    recipient_address: z.string().optional().describe('Recipient address on destination chain'),
  })
  .strict();

export type CrossChainBridgeInput = z.infer<typeof CrossChainBridgeInputSchema>;

export const TransactionResultSchema = z
  .object({
    tx_hash: z.string().describe('Transaction hash'),
    block_number: z.number().describe('Block number where transaction was mined'),
    gas_used: z.number().describe('Gas consumed by transaction'),
    gas_price_gwei: z.string().describe('Gas price in Gwei'),
    total_cost_eth: z.string().describe('Total transaction cost in ETH'),
    explorer_url: z.string().describe('Block explorer URL for transaction'),
    status: z.enum(['success', 'failed']).describe('Transaction status'),
  })
  .strict();

export type TransactionResult = z.infer<typeof TransactionResultSchema>;

export const TokenAmountSchema = z
  .object({
    token_symbol: z.string(),
    token_address: z.string(),
    amount: z.string().describe('Amount with full precision'),
    amount_usd: z.string().optional().describe('USD value at execution time'),
    decimals: z.number().default(18).describe('Token decimals'),
  })
  .strict();

export type TokenAmount = z.infer<typeof TokenAmountSchema>;

export const RouteStepSchema = z
  .object({
    protocol: z.string().describe("Protocol used (e.g., 'Uniswap V3', 'Aave')"),
    action: z.string().describe("Action performed (e.g., 'swap', 'deposit')"),
    from_token: TokenAmountSchema,
    to_token: TokenAmountSchema,
    gas_estimate: z.number(),
  })
  .strict();

export type RouteStep = z.infer<typeof RouteStepSchema>;

export const EnsoExecutionResultSchema = z
  .object({
    operation_type: z.string().describe('Type of operation executed'),
    status: z.enum(['success', 'failed', 'pending']).describe('Execution status'),
    input_amount: TokenAmountSchema.describe('Input token and amount'),
    output_amount: TokenAmountSchema.optional().describe('Output token and amount (for swaps)'),
    route_taken: z.array(RouteStepSchema).describe('The optimal route that was executed'),
    steps_executed: z.number().describe('Number of protocol interactions'),
    execution_time_seconds: z.number().describe('Total execution time'),
    transaction: TransactionResultSchema.describe('On-chain transaction details'),
    total_gas_cost_usd: z.string().describe('Total gas cost in USD'),
    price_impact: z.number().describe('Price impact percentage'),
    effective_rate: z.string().optional().describe('Effective exchange rate (for swaps)'),
    final_balance: z
      .record(z.string(), z.string())
      .describe('Final token balances after operation'),
    apy: z.number().optional().describe('Annual percentage yield (for staking)'),
    timestamp: z.string().describe('ISO timestamp of execution'),
    enso_route_id: z.string().describe('ENSO route identifier for tracking'),
    error_message: z.string().optional().describe("Error message if status is 'failed'"),
    retry_suggested: z.boolean().default(false).describe('Whether retry is recommended'),
  })
  .strict();

export type EnsoExecutionResult = z.infer<typeof EnsoExecutionResultSchema>;

export const YieldOpportunitySchema = z
  .object({
    protocol: z.string().describe("Protocol name (e.g., 'Aave', 'Compound')"),
    pool_name: z.string().describe('Pool or strategy name'),
    token: z.string().describe('Token being staked'),
    apy: z.number().min(0).max(1000).describe('Current APY'),
    tvl: z.string().describe('Total Value Locked in USD'),
    risk_score: z.number().min(0).max(10).describe('Risk score (0=lowest, 10=highest)'),
    lock_period: z.number().describe('Lock period in days (0 for flexible)'),
    chain: z.string().describe('Blockchain where the opportunity exists'),
  })
  .strict();

export type YieldOpportunity = z.infer<typeof YieldOpportunitySchema>;

export const YieldOptimizationReportSchema = z
  .object({
    recommended_strategy: YieldOpportunitySchema.describe('Top recommended yield opportunity'),
    alternative_strategies: z
      .array(YieldOpportunitySchema)
      .describe('Alternative options ranked by score'),
    projected_returns: z
      .record(z.string(), z.string())
      .describe('Projected returns over different time periods'),
    risk_analysis: z.string().describe('Comprehensive risk analysis of recommendation'),
    gas_cost_estimate: z.string().describe('Estimated gas cost for entering position'),
    breakeven_time_days: z.number().describe('Days until gas costs are covered by yield'),
  })
  .strict();

export type YieldOptimizationReport = z.infer<typeof YieldOptimizationReportSchema>;

export const CrossChainBridgeResultSchema = z
  .object({
    status: z.enum(['initiated', 'pending', 'completed', 'failed']),
    from_chain: z.string(),
    to_chain: z.string(),
    from_tx_hash: z.string().describe('Transaction hash on source chain'),
    to_tx_hash: z.string().optional().describe('Transaction hash on destination chain'),
    bridge_protocol: z.string().describe('Bridge protocol used'),
    amount_sent: TokenAmountSchema,
    amount_received: TokenAmountSchema.optional().describe('Amount received on destination chain'),
    bridge_fee: z.string().describe('Bridge fee in USD'),
    estimated_arrival_time: z.string().optional().describe('Estimated time for completion'),
    tracking_url: z.string().describe('URL to track bridge transaction'),
  })
  .strict();

export type CrossChainBridgeResult = z.infer<typeof CrossChainBridgeResultSchema>;

export const EnsoDeFiAgentMetadataSchema = z
  .object({
    agent_name: z.string().default('enso-defi-agent'),
    version: z.string().default('1.0.0'),
    description: z
      .string()
      .default(
        'Executes decentralized finance operations using the ENSO intent-based execution engine. Handles token swaps, yield optimization, staking, cross-chain bridging, and complex DeFi strategies with automatic route optimization and minimal gas costs.'
      ),
    capabilities: z
      .array(z.string())
      .default([
        'Token swaps with optimal routing',
        'Yield farming and staking',
        'Cross-chain token bridging',
        'DeFi position management',
        'Gas optimization',
        'Multi-protocol aggregation',
        'Intent-based execution',
        'Slippage protection',
      ]),
    supported_chains: z
      .array(z.string())
      .default(['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'avalanche']),
    supported_operations: z
      .array(z.string())
      .default(['swap', 'stake', 'bridge', 'withdraw', 'compound']),
    input_models: z
      .array(z.string())
      .default(['EnsoDeFiInput', 'TokenSwapInput', 'YieldStakingInput', 'CrossChainBridgeInput']),
    output_models: z
      .array(z.string())
      .default(['EnsoExecutionResult', 'YieldOptimizationReport', 'CrossChainBridgeResult']),
    protocols_integrated: z
      .array(z.string())
      .default(['Uniswap V2/V3', 'Aave', 'Compound', 'Curve', 'Balancer', 'ENSO Router']),
    llm_consumable_description: z
      .string()
      .default(
        "I can execute any DeFi operation using natural language intents. Simply tell me what you want to do (e.g., 'Swap 10 ETH for USDC', 'Stake 100 USDC for highest yield', 'Bridge 50 USDC from Ethereum to Arbitrum') and I'll find the optimal route, minimize gas costs, and execute atomically. I support multi-step operations and can route across any supported chain."
      ),
  })
  .strict();

export type EnsoDeFiAgentMetadata = z.infer<typeof EnsoDeFiAgentMetadataSchema>;

/**
 * ============================================================================
 * AKASH NETWORK COMPUTE (7.0 Crypto Operations Division)
 * ============================================================================
 */

export const AkashDeploymentInputSchema = z
  .object({
    deployment_type: z
      .enum(['ai_training', 'model_inference', 'api_service', 'agent_runtime', 'custom'])
      .describe('Type of compute workload'),
    docker_image: z.string().describe("Docker image to deploy (e.g., 'pytorch/pytorch:latest')"),
    command: z.array(z.string()).optional().describe('Command to run in container'),
    environment_variables: z
      .record(z.string(), z.string())
      .default({})
      .describe('Environment variables'),
    cpu_cores: z.number().min(1).max(128).describe('Number of CPU cores'),
    memory_gb: z.number().min(1).max(512).describe('Memory in GB'),
    storage_gb: z.number().min(10).max(10000).describe('Persistent storage in GB'),
    gpu_model: z
      .enum(['NVIDIA_A100', 'NVIDIA_V100', 'NVIDIA_B200', 'AMD_MI250'])
      .optional()
      .describe('GPU model (optional)'),
    gpu_count: z.number().min(0).max(8).default(0).describe('Number of GPUs'),
    expose_ports: z.array(z.number()).default([]).describe('Ports to expose'),
    requires_public_ip: z.boolean().default(false).describe('Whether deployment needs public IP'),
    region_preference: z.array(z.string()).optional().describe('Preferred data center regions'),
    max_bid_price_uakt: z.number().optional().describe('Maximum bid price in uAKT'),
    auto_renewal: z.boolean().default(true).describe('Automatically renew deployment'),
    duration_hours: z
      .number()
      .min(1)
      .max(8760)
      .optional()
      .describe('Deployment duration (None for indefinite)'),
  })
  .strict();

export type AkashDeploymentInput = z.infer<typeof AkashDeploymentInputSchema>;

export const AITrainingJobInputSchema = z
  .object({
    model_type: z
      .enum(['transformer', 'cnn', 'gan', 'diffusion', 'reinforcement_learning'])
      .describe('Type of AI model to train'),
    training_data_url: z.string().url().describe('URL to training dataset'),
    model_config_url: z.string().url().optional().describe('URL to model configuration file'),
    framework: z
      .enum(['pytorch', 'tensorflow', 'jax', 'custom'])
      .default('pytorch')
      .describe('ML framework'),
    checkpoint_url: z.string().url().optional().describe('URL to resume from checkpoint'),
    epochs: z.number().min(1).max(1000).describe('Number of training epochs'),
    batch_size: z.number().min(1).max(512).default(32).describe('Training batch size'),
    gpu_required: z.boolean().default(true).describe('Whether GPU is required'),
  })
  .strict();

export type AITrainingJobInput = z.infer<typeof AITrainingJobInputSchema>;

export const InferenceServiceInputSchema = z
  .object({
    model_url: z.string().url().describe('URL to trained model weights'),
    framework: z.enum(['pytorch', 'tensorflow', 'onnx', 'custom']).describe('Model framework'),
    api_type: z.enum(['rest', 'grpc', 'websocket']).default('rest').describe('API protocol'),
    max_concurrent_requests: z
      .number()
      .min(1)
      .max(100)
      .default(10)
      .describe('Max concurrent inference requests'),
    input_schema: z.record(z.string(), z.string()).describe('API input schema'),
    output_schema: z.record(z.string(), z.string()).describe('API output schema'),
  })
  .strict();

export type InferenceServiceInput = z.infer<typeof InferenceServiceInputSchema>;

export const AkashProviderInfoSchema = z
  .object({
    provider_address: z.string().describe('Akash provider wallet address'),
    region: z.string().describe('Geographic region'),
    datacenter: z.string().describe('Data center name'),
    available_resources: z.record(z.string(), z.number()).describe('Available compute resources'),
    reputation_score: z.number().min(0).max(10).describe('Provider reputation'),
    uptime_percentage: z.number().min(0).max(100).describe('Historical uptime'),
  })
  .strict();

export type AkashProviderInfo = z.infer<typeof AkashProviderInfoSchema>;

export const DeploymentResultSchema = z
  .object({
    deployment_id: z.string().describe('Unique deployment identifier'),
    status: z.enum(['active', 'pending', 'failed', 'closed']).describe('Deployment status'),
    provider: AkashProviderInfoSchema.describe('Assigned compute provider'),
    lease_id: z.string().describe('Lease identifier'),
    public_endpoints: z.array(z.string()).default([]).describe('Public endpoint URLs'),
    internal_hostname: z.string().describe('Internal hostname for service'),
    ssh_access: z.string().optional().describe('SSH access command (if enabled)'),
    resources_allocated: z.record(z.string(), z.string()).describe('Actual resources allocated'),
    cpu_cores: z.number(),
    memory_gb: z.number(),
    storage_gb: z.number(),
    gpu_model: z.string().optional(),
    gpu_count: z.number(),
    cost_per_hour_uakt: z.number().describe('Hourly cost in micro-AKT'),
    cost_per_hour_usd: z.string().describe('Hourly cost in USD'),
    deposit_paid_uakt: z.number().describe('Deposit paid'),
    estimated_monthly_cost_usd: z.string().describe('Estimated monthly cost'),
    docker_image: z.string().describe('Docker image deployed'),
    created_at: z.string().datetime().describe('Deployment creation time'),
    expires_at: z.string().datetime().optional().describe('Deployment expiration time'),
    auto_renewal: z.boolean(),
    health_check_url: z.string().optional().describe('Health check endpoint'),
    logs_url: z.string().optional().describe('URL to view logs'),
  })
  .strict();

export type DeploymentResult = z.infer<typeof DeploymentResultSchema>;

export const TrainingJobResultSchema = z
  .object({
    job_id: z.string().describe('Training job identifier'),
    status: z.enum(['completed', 'failed', 'stopped']).describe('Job status'),
    final_loss: z.number().describe('Final training loss'),
    final_accuracy: z.number().optional().describe('Final accuracy metric'),
    epochs_completed: z.number().describe('Number of epochs completed'),
    training_time_hours: z.number().describe('Total training time'),
    model_checkpoint_url: z.string().url().describe('URL to trained model checkpoint'),
    tensorboard_logs_url: z.string().url().optional().describe('URL to TensorBoard logs'),
    metrics_json_url: z.string().url().describe('URL to training metrics JSON'),
    samples_processed: z.number().describe('Total training samples processed'),
    iterations: z.number().describe('Total training iterations'),
    gpu_hours_used: z.number().describe('GPU hours consumed'),
    compute_cost_akt: z.string().describe('Total cost in AKT'),
    compute_cost_usd: z.string().describe('Total cost in USD'),
    cost_per_epoch: z.string().describe('Average cost per epoch'),
    throughput_samples_per_second: z.number().describe('Training throughput'),
    gpu_utilization_avg: z.number().min(0).max(100).describe('Average GPU utilization percentage'),
  })
  .strict();

export type TrainingJobResult = z.infer<typeof TrainingJobResultSchema>;

export const InferenceAPIResultSchema = z
  .object({
    service_id: z.string().describe('Service identifier'),
    api_endpoint: z.string().url().describe('Public API endpoint URL'),
    api_key: z.string().describe('API key for authentication'),
    model_info: z.record(z.string(), z.string()).describe('Deployed model information'),
    framework: z.string().describe('ML framework'),
    api_type: z.string().describe('API protocol'),
    max_throughput_rps: z.number().describe('Maximum requests per second'),
    average_latency_ms: z.number().describe('Average inference latency'),
    cold_start_time_ms: z.number().describe('Cold start latency'),
    api_docs_url: z.string().url().describe('API documentation URL'),
    example_request: z.record(z.string(), z.string()).describe('Example API request'),
    example_response: z.record(z.string(), z.string()).describe('Example API response'),
    cost_per_1k_requests: z.string().describe('Cost per 1,000 inference requests'),
    monthly_base_cost_usd: z.string().describe('Base hosting cost per month'),
  })
  .strict();

export type InferenceAPIResult = z.infer<typeof InferenceAPIResultSchema>;

export const AkashComputeAgentMetadataSchema = z
  .object({
    agent_name: z.string().default('akash-compute-agent'),
    version: z.string().default('1.0.0'),
    description: z
      .string()
      .default(
        'Deploys and manages general-purpose compute workloads on Akash Network, the decentralized cloud. Specializes in AI/ML training, model inference APIs, sovereign agent hosting, and any Docker-based workload. Provides access to high-end NVIDIA GPUs at a fraction of cloud provider costs.'
      ),
    capabilities: z
      .array(z.string())
      .default([
        'AI model training (LLMs, vision models, etc.)',
        'Model inference API deployment',
        'Containerized application hosting',
        'Sovereign AI agent runtime',
        'GPU compute for any workload',
        'Custom Docker deployments',
        'Auto-scaling services',
        'Global deployment regions',
      ]),
    supported_gpu_models: z
      .array(z.string())
      .default([
        'NVIDIA H100',
        'NVIDIA A100',
        'NVIDIA V100',
        'NVIDIA B200 (Blackwell)',
        'AMD MI250',
      ]),
    typical_deployments: z
      .array(z.string())
      .default([
        'Large language model training',
        'Stable Diffusion fine-tuning',
        'Autonomous agent hosting',
        'API microservices',
        'Data processing pipelines',
        'Web application backends',
      ]),
    input_models: z
      .array(z.string())
      .default(['AkashDeploymentInput', 'AITrainingJobInput', 'InferenceServiceInput']),
    output_models: z
      .array(z.string())
      .default(['DeploymentResult', 'TrainingJobResult', 'InferenceAPIResult']),
    cost_advantages: z
      .array(z.string())
      .default([
        '60-80% cheaper than AWS/GCP/Azure',
        'No vendor lock-in',
        'Pay-per-use pricing',
        'Decentralized marketplace',
        'Competitive bidding',
      ]),
    llm_consumable_description: z
      .string()
      .default(
        "I deploy and manage compute workloads on Akash Network's decentralized cloud. Tell me what you need to run (e.g., 'Train a Llama-2 model', 'Deploy a FastAPI service', 'Host a Stable Diffusion API') and I'll provision the resources, handle deployment, and provide access endpoints. Perfect for AI training, inference APIs, and hosting autonomous agents at 60-80% lower cost than traditional clouds."
      ),
  })
  .strict();

export type AkashComputeAgentMetadata = z.infer<typeof AkashComputeAgentMetadataSchema>;

/**
 * ============================================================================
 * ARWEAVE & AO MEMORY (7.0 Crypto Operations Division)
 * ============================================================================
 */

export const ArweaveStorageInputSchema = z
  .object({
    data_type: z
      .enum(['audit_log', 'agent_state', 'nft_metadata', 'document', 'binary'])
      .describe('Type of data being stored'),
    content: z.string().describe('Data content (JSON string for structured data)'),
    tags: z.record(z.string(), z.string()).default({}).describe('Metadata tags for searchability'),
    content_type: z.string().default('application/json').describe('MIME type of content'),
    encrypt: z.boolean().default(false).describe('Whether to encrypt data before storage'),
  })
  .strict();

export type ArweaveStorageInput = z.infer<typeof ArweaveStorageInputSchema>;

export const AuditLogEntrySchema = z
  .object({
    event_type: z.string().describe("Type of event (e.g., 'TRANSACTION', 'STATE_CHANGE')"),
    event_data: z.record(z.string(), z.any()).describe('Event-specific data'),
    actor: z.string().describe('Agent or user who triggered the event'),
    timestamp: z.string().datetime().describe('Timestamp of the event'),
    severity: z
      .enum(['info', 'warning', 'error', 'critical'])
      .default('info')
      .describe('Log severity'),
    tags: z.record(z.string(), z.string()).default({}).describe('Additional metadata'),
  })
  .strict();

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

export const AOStateManagementInputSchema = z
  .object({
    process_id: z.string().describe('AO process identifier'),
    action: z
      .enum(['save_state', 'load_state', 'update_state', 'delete_state'])
      .describe('State management action'),
    state_data: z.record(z.string(), z.any()).optional().describe('State data to save/update'),
    state_key: z.string().optional().describe('Specific state key to operate on'),
  })
  .strict();

export type AOStateManagementInput = z.infer<typeof AOStateManagementInputSchema>;

export const MemoryQueryInputSchema = z
  .object({
    query_type: z
      .enum(['by_tag', 'by_address', 'by_transaction', 'by_content'])
      .describe('Type of query to perform'),
    filters: z.record(z.string(), z.string()).describe('Query filters (e.g., tags, address)'),
    limit: z.number().min(1).max(100).default(10).describe('Maximum number of results'),
    sort_order: z.enum(['asc', 'desc']).default('desc').describe('Sort order by timestamp'),
  })
  .strict();

export type MemoryQueryInput = z.infer<typeof MemoryQueryInputSchema>;

export const ArweaveTransactionSchema = z
  .object({
    tx_id: z.string().describe('Arweave transaction ID'),
    data_hash: z.string().describe('SHA-256 hash of stored data'),
    data_size_bytes: z.number().describe('Size of stored data'),
    block_height: z.number().optional().describe('Block where transaction was mined'),
    confirmations: z.number().default(0).describe('Number of confirmations'),
    gateway_url: z.string().url().describe('Gateway URL to access data'),
    explorer_url: z.string().url().describe('Block explorer URL'),
    cost_ar: z.string().describe('Storage cost in AR tokens'),
    cost_usd: z.string().describe('Storage cost in USD'),
    cost_per_mb: z.string().describe('Cost per megabyte'),
    tags: z.record(z.string(), z.string()).default({}).describe('Transaction tags'),
    content_type: z.string().describe('Content MIME type'),
    timestamp: z.string().datetime().describe('Transaction timestamp'),
    permanent: z
      .boolean()
      .default(true)
      .describe('Whether storage is permanent (always true for Arweave)'),
    retrievable: z.boolean().default(true).describe('Whether data is currently retrievable'),
  })
  .strict();

export type ArweaveTransaction = z.infer<typeof ArweaveTransactionSchema>;

export const StorageResultSchema = z
  .object({
    status: z.enum(['pending', 'confirmed', 'failed']).describe('Storage operation status'),
    transaction: ArweaveTransactionSchema.describe('Arweave transaction details'),
    data_url: z.string().url().describe('Direct URL to access stored data'),
    ipfs_mirror: z.string().url().optional().describe('IPFS mirror URL (if available)'),
    data_hash: z.string().describe('SHA-256 hash for verification'),
    signature: z.string().describe('Cryptographic signature'),
    estimated_lifespan_years: z
      .number()
      .default(200)
      .describe('Estimated data permanence (Arweave guarantees 200+ years)'),
  })
  .strict();

export type StorageResult = z.infer<typeof StorageResultSchema>;

export const AOProcessStateSchema = z
  .object({
    process_id: z.string().describe('AO process identifier'),
    state_version: z.number().describe('State version number'),
    state_data: z.record(z.string(), z.any()).describe('Current state data'),
    last_updated: z.string().datetime().describe('Last state update timestamp'),
    updated_by: z.string().describe('Last updated by'),
    state_size_kb: z.number().describe('State size in kilobytes'),
    message_id: z.string().describe('AO message ID that created/updated this state'),
    arweave_tx_id: z.string().describe('Underlying Arweave transaction ID'),
    state_hash: z.string().describe('Hash of state data'),
    merkle_root: z.string().describe('Merkle root for state verification'),
  })
  .strict();

export type AOProcessState = z.infer<typeof AOProcessStateSchema>;

export const AuditLogResultSchema = z
  .object({
    log_id: z.string().describe('Unique log entry identifier'),
    stored_on_arweave: z.boolean().describe('Whether log was stored on Arweave'),
    arweave_tx: ArweaveTransactionSchema.optional().describe('Arweave transaction details'),
    event_type: z.string().describe('Type of event logged'),
    timestamp: z.string().datetime().describe('Event timestamp'),
    severity: z.string().describe('Log severity'),
    immutable: z.boolean().default(true).describe('Whether log is immutable'),
    tamper_proof: z.boolean().default(true).describe('Whether log is tamper-proof'),
    cryptographically_signed: z
      .boolean()
      .default(true)
      .describe('Whether log is cryptographically signed'),
  })
  .strict();

export type AuditLogResult = z.infer<typeof AuditLogResultSchema>;

export const QueryResultSchema = z
  .object({
    query_type: z.string().describe('Type of query performed'),
    results_found: z.number().describe('Number of results found'),
    transactions: z.array(ArweaveTransactionSchema).default([]).describe('Matching transactions'),
    query_time_ms: z.number().describe('Query execution time in milliseconds'),
    cache_hit: z.boolean().default(false).describe('Whether result was cached'),
    has_more: z.boolean().default(false).describe('Whether more results are available'),
    next_cursor: z.string().optional().describe('Cursor for next page of results'),
  })
  .strict();

export type QueryResult = z.infer<typeof QueryResultSchema>;

export const DataRetrievalResultSchema = z
  .object({
    tx_id: z.string().describe('Transaction ID of retrieved data'),
    content: z.string().describe('Retrieved data content'),
    content_type: z.string().describe('Content MIME type'),
    data_hash: z.string().describe('SHA-256 hash of data'),
    hash_verified: z.boolean().describe('Whether hash matches stored hash'),
    signature_verified: z.boolean().describe('Whether signature is valid'),
    tags: z.record(z.string(), z.string()).default({}).describe('Transaction tags'),
    block_height: z.number().describe('Block where data was stored'),
    age_days: z.number().describe('Age of data in days'),
    retrieval_time_ms: z.number().describe('Time taken to retrieve data'),
    source: z.enum(['gateway', 'cache', 'peer']).describe('Data source'),
  })
  .strict();

export type DataRetrievalResult = z.infer<typeof DataRetrievalResultSchema>;

export const ArweaveMemoryAgentMetadataSchema = z
  .object({
    agent_name: z.string().default('arweave-memory-agent'),
    version: z.string().default('1.0.0'),
    description: z
      .string()
      .default(
        'Manages permanent storage and state using Arweave (the permaweb) and AO (the hyper-parallel computer). Provides immutable audit logging, state management, and permanent data storage with cryptographic verification. Perfect for compliance, auditability, and building transparent autonomous systems.'
      ),
    capabilities: z
      .array(z.string())
      .default([
        'Permanent data storage (200+ year guarantee)',
        'Immutable audit logging',
        'State management via AO',
        'Cryptographic verification',
        'Decentralized data retrieval',
        'Content addressing',
        'Tamper-proof records',
        'Query and search',
      ]),
    storage_guarantees: z
      .array(z.string())
      .default([
        'Permanent (200+ years)',
        'Immutable (cannot be altered)',
        'Decentralized (no single point of failure)',
        'Cryptographically signed',
        'Globally accessible',
        'Censorship-resistant',
      ]),
    typical_use_cases: z
      .array(z.string())
      .default([
        'Agent action audit logs',
        'NFT metadata storage',
        'Compliance documentation',
        'Autonomous system state',
        'Transaction records',
        'Data provenance',
        'Legal records',
        'Research data archival',
      ]),
    input_models: z
      .array(z.string())
      .default([
        'ArweaveStorageInput',
        'AuditLogEntry',
        'AOStateManagementInput',
        'MemoryQueryInput',
      ]),
    output_models: z
      .array(z.string())
      .default([
        'StorageResult',
        'AOProcessState',
        'AuditLogResult',
        'QueryResult',
        'DataRetrievalResult',
      ]),
    integration_notes: z
      .array(z.string())
      .default([
        'All agent actions should be logged to Arweave for auditability',
        'State should be checkpointed to AO for recoverability',
        'NFT metadata must be stored on Arweave before minting',
        'Compliance requires immutable audit trail',
      ]),
    llm_consumable_description: z
      .string()
      .default(
        "I provide permanent storage and immutable audit logging using Arweave and AO. Tell me what you need to store or log (e.g., 'Log this transaction', 'Store agent state', 'Save NFT metadata permanently') and I'll handle encryption, verification, and permanent storage. All data is immutable, cryptographically signed, and guaranteed permanent for 200+ years. Perfect for compliance, auditability, and transparent autonomous systems."
      ),
  })
  .strict();

export type ArweaveMemoryAgentMetadata = z.infer<typeof ArweaveMemoryAgentMetadataSchema>;

/**
 * ============================================================================
 * RENDER NETWORK (7.0 Crypto Operations Division)
 * ============================================================================
 */

export const RenderJobInputSchema = z
  .object({
    job_type: z
      .enum(['3d_generation', 'image_generation', 'video_render', 'vfx_composite'])
      .describe('Type of rendering/generation job'),
    prompt: z.string().optional().describe('AI generation prompt (for generative tasks)'),
    scene_file_url: z
      .string()
      .url()
      .optional()
      .describe('URL to 3D scene file (for rendering tasks)'),
    engine: z
      .enum(['StabilityAI', 'Blender', 'Houdini', 'Unreal', 'Custom'])
      .default('StabilityAI')
      .describe('Rendering/generation engine to use'),
    output_format: z
      .enum(['png', 'jpg', 'glb', 'gltf', 'fbx', 'mp4', 'exr'])
      .describe('Desired output format'),
    resolution: z
      .string()
      .default('1024x1024')
      .describe("Output resolution (e.g., '1920x1080', '2048x2048')"),
    quality: z
      .enum(['draft', 'medium', 'high', 'production'])
      .default('high')
      .describe('Quality preset'),
    samples: z.number().min(1).max(1000).default(50).describe('Sampling/quality iterations'),
    priority: z
      .enum(['low', 'normal', 'high', 'urgent'])
      .default('normal')
      .describe('Job priority level'),
  })
  .strict();

export type RenderJobInput = z.infer<typeof RenderJobInputSchema>;

export const Image3DGenerationInputSchema = z
  .object({
    description: z.string().describe('Text description of the 3D model to generate'),
    style: z
      .enum(['realistic', 'stylized', 'low_poly', 'photorealistic'])
      .default('realistic')
      .describe('Visual style'),
    output_format: z.enum(['glb', 'gltf', 'fbx', 'obj']).default('glb').describe('3D file format'),
    include_textures: z.boolean().default(true).describe('Whether to include PBR textures'),
    polycount_target: z
      .enum(['low', 'medium', 'high'])
      .default('medium')
      .describe('Target polygon count'),
  })
  .strict();

export type Image3DGenerationInput = z.infer<typeof Image3DGenerationInputSchema>;

export const ImageGenerationInputSchema = z
  .object({
    prompt: z.string().min(3).describe('Image generation prompt'),
    negative_prompt: z.string().optional().describe('Elements to avoid in generation'),
    style: z.string().optional().describe('Artistic style'),
    aspect_ratio: z
      .enum(['1:1', '16:9', '4:3', '3:2', '9:16'])
      .default('1:1')
      .describe('Image aspect ratio'),
    quality: z
      .enum(['draft', 'standard', 'high', 'ultra'])
      .default('high')
      .describe('Generation quality'),
    num_images: z.number().min(1).max(10).default(1).describe('Number of variations to generate'),
  })
  .strict();

export type ImageGenerationInput = z.infer<typeof ImageGenerationInputSchema>;

export const RenderAssetSchema = z
  .object({
    asset_id: z.string().describe('Unique asset identifier'),
    asset_url: z.string().url().describe('URL to download the asset'),
    asset_type: z.string().describe('Asset type/format'),
    file_size_mb: z.number().describe('File size in megabytes'),
    resolution: z.string().describe('Asset resolution'),
    metadata: z.record(z.string(), z.string()).default({}).describe('Additional asset metadata'),
    thumbnail_url: z.string().url().optional().describe('Preview thumbnail URL'),
    ipfs_hash: z.string().optional().describe('IPFS hash if stored on IPFS'),
  })
  .strict();

export type RenderAsset = z.infer<typeof RenderAssetSchema>;

export const RenderJobResultSchema = z
  .object({
    job_id: z.string().describe('Render job identifier'),
    status: z.enum(['completed', 'failed', 'cancelled']).describe('Job status'),
    primary_asset: RenderAssetSchema.describe('Main output asset'),
    additional_assets: z
      .array(RenderAssetSchema)
      .default([])
      .describe('Additional outputs (variations, etc.)'),
    engine_used: z.string().describe('Rendering engine that processed the job'),
    render_time_seconds: z.number().describe('Total render time'),
    gpu_used: z.string().describe('GPU hardware used for rendering'),
    render_nodes: z.number().describe('Number of distributed nodes used'),
    compute_cost_rndr: z.string().describe('Cost in RNDR tokens'),
    compute_cost_usd: z.string().describe('Cost in USD equivalent'),
    cost_per_second: z.string().describe('Cost per second of render time'),
    quality_score: z.number().min(0).max(10).optional().describe('Automated quality assessment'),
    artifacts_detected: z.array(z.string()).default([]).describe('Visual artifacts detected'),
    submitted_at: z.string().datetime().describe('Job submission time'),
    started_at: z.string().datetime().describe('Render start time'),
    completed_at: z.string().datetime().describe('Render completion time'),
    error_message: z.string().optional().describe('Error details if job failed'),
    partial_results: z
      .array(RenderAssetSchema)
      .default([])
      .describe('Partial results if job was cancelled'),
  })
  .strict();

export type RenderJobResult = z.infer<typeof RenderJobResultSchema>;

export const GeneratedModel3DSchema = z
  .object({
    model_id: z.string().describe('Unique model identifier'),
    description: z.string().describe('Original generation prompt'),
    model_url: z.string().url().describe('URL to download 3D model'),
    model_format: z.string().describe('3D file format'),
    texture_urls: z.array(z.string().url()).default([]).describe('PBR texture map URLs'),
    polygon_count: z.number().describe('Total polygon count'),
    vertex_count: z.number().describe('Total vertex count'),
    has_animations: z.boolean().default(false).describe('Whether model includes animations'),
    has_rigging: z.boolean().default(false).describe('Whether model is rigged'),
    preview_images: z.array(z.string().url()).describe('Preview render URLs'),
    turntable_video: z.string().url().optional().describe('360° turntable video URL'),
    bounding_box: z.record(z.string(), z.number()).describe('Model bounding box dimensions'),
    file_size_mb: z.number().describe('Total file size including textures'),
    generation_time_seconds: z.number().describe('Time taken to generate'),
    cost_usd: z.string().describe('Generation cost in USD'),
  })
  .strict();

export type GeneratedModel3D = z.infer<typeof GeneratedModel3DSchema>;

export const GPUResourceUsageSchema = z
  .object({
    gpu_model: z.string().describe('GPU hardware model used'),
    gpu_memory_used_gb: z.number().describe('VRAM used in GB'),
    compute_time_seconds: z.number().describe('Active GPU compute time'),
    power_usage_kwh: z.number().describe('Estimated power consumption'),
    carbon_offset_kg: z.number().optional().describe('Carbon offset purchased (if applicable)'),
  })
  .strict();

export type GPUResourceUsage = z.infer<typeof GPUResourceUsageSchema>;

export const RenderNetworkAgentMetadataSchema = z
  .object({
    agent_name: z.string().default('render-network-agent'),
    version: z.string().default('1.0.0'),
    description: z
      .string()
      .default(
        "Executes 3D rendering, VFX, and generative AI tasks using Render Network's decentralized GPU infrastructure. Specializes in high-quality 3D model generation, image synthesis, video rendering, and complex visual effects processing."
      ),
    capabilities: z
      .array(z.string())
      .default([
        'AI-powered 3D model generation',
        'Text-to-image generation',
        '3D scene rendering (Blender, Houdini, Unreal)',
        'VFX compositing',
        'Video rendering',
        'PBR texture generation',
        'Turntable/product visualization',
        'Distributed GPU compute',
      ]),
    supported_engines: z
      .array(z.string())
      .default(['StabilityAI', 'Blender', 'Houdini', 'Unreal Engine', 'Custom engines']),
    supported_formats: z
      .array(z.string())
      .default([
        '3D: GLB, GLTF, FBX, OBJ, USD',
        'Image: PNG, JPG, EXR, TIFF',
        'Video: MP4, MOV, WebM',
      ]),
    input_models: z
      .array(z.string())
      .default(['RenderJobInput', 'Image3DGenerationInput', 'ImageGenerationInput']),
    output_models: z
      .array(z.string())
      .default(['RenderJobResult', 'GeneratedModel3D', 'GPUResourceUsage']),
    typical_use_cases: z
      .array(z.string())
      .default([
        'Generate 3D models for NFTs',
        'Create product visualizations',
        'Render architectural visualizations',
        'Generate game assets',
        'Create marketing materials',
        'Process VFX for video content',
      ]),
    llm_consumable_description: z
      .string()
      .default(
        "I can generate 3D models, images, and videos using AI and traditional rendering engines on Render Network's decentralized GPU infrastructure. Tell me what you want to create (e.g., 'Generate a 3D model of a futuristic car', 'Create a photorealistic image of a sunset over mountains', 'Render a Blender scene') and I'll handle the GPU compute, file management, and delivery. Perfect for NFT creation, game assets, product visualization, and creative content."
      ),
  })
  .strict();

export type RenderNetworkAgentMetadata = z.infer<typeof RenderNetworkAgentMetadataSchema>;
