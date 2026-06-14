import { z } from 'zod';
/**
 * ============================================================================
 * ENSO DEFI OPERATIONS (7.0 Crypto Operations Division)
 * ============================================================================
 */
export declare const EnsoDeFiInputSchema: z.ZodObject<{
    operation_type: z.ZodEnum<{
        swap: "swap";
        stake: "stake";
        bridge: "bridge";
        withdraw: "withdraw";
        compound: "compound";
    }>;
    token_in: z.ZodString;
    amount: z.ZodString;
    token_out: z.ZodOptional<z.ZodString>;
    chain_from: z.ZodOptional<z.ZodString>;
    chain_to: z.ZodOptional<z.ZodString>;
    strategy: z.ZodDefault<z.ZodEnum<{
        highest_yield: "highest_yield";
        lowest_risk: "lowest_risk";
        balanced: "balanced";
    }>>;
    slippage_tolerance: z.ZodDefault<z.ZodNumber>;
    gas_priority: z.ZodDefault<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>>;
}, z.core.$strict>;
export type EnsoDeFiInput = z.infer<typeof EnsoDeFiInputSchema>;
export declare const TokenSwapInputSchema: z.ZodObject<{
    from_token: z.ZodString;
    to_token: z.ZodString;
    amount: z.ZodString;
    min_output: z.ZodOptional<z.ZodString>;
    slippage_tolerance: z.ZodDefault<z.ZodNumber>;
}, z.core.$strict>;
export type TokenSwapInput = z.infer<typeof TokenSwapInputSchema>;
export declare const YieldStakingInputSchema: z.ZodObject<{
    token: z.ZodString;
    amount: z.ZodString;
    min_apy: z.ZodOptional<z.ZodNumber>;
    lock_period: z.ZodOptional<z.ZodNumber>;
    strategy: z.ZodDefault<z.ZodEnum<{
        highest_yield: "highest_yield";
        lowest_risk: "lowest_risk";
        balanced: "balanced";
    }>>;
}, z.core.$strict>;
export type YieldStakingInput = z.infer<typeof YieldStakingInputSchema>;
export declare const CrossChainBridgeInputSchema: z.ZodObject<{
    token: z.ZodString;
    amount: z.ZodString;
    from_chain: z.ZodString;
    to_chain: z.ZodString;
    recipient_address: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type CrossChainBridgeInput = z.infer<typeof CrossChainBridgeInputSchema>;
export declare const TransactionResultSchema: z.ZodObject<{
    tx_hash: z.ZodString;
    block_number: z.ZodNumber;
    gas_used: z.ZodNumber;
    gas_price_gwei: z.ZodString;
    total_cost_eth: z.ZodString;
    explorer_url: z.ZodString;
    status: z.ZodEnum<{
        success: "success";
        failed: "failed";
    }>;
}, z.core.$strict>;
export type TransactionResult = z.infer<typeof TransactionResultSchema>;
export declare const TokenAmountSchema: z.ZodObject<{
    token_symbol: z.ZodString;
    token_address: z.ZodString;
    amount: z.ZodString;
    amount_usd: z.ZodOptional<z.ZodString>;
    decimals: z.ZodDefault<z.ZodNumber>;
}, z.core.$strict>;
export type TokenAmount = z.infer<typeof TokenAmountSchema>;
export declare const RouteStepSchema: z.ZodObject<{
    protocol: z.ZodString;
    action: z.ZodString;
    from_token: z.ZodObject<{
        token_symbol: z.ZodString;
        token_address: z.ZodString;
        amount: z.ZodString;
        amount_usd: z.ZodOptional<z.ZodString>;
        decimals: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strict>;
    to_token: z.ZodObject<{
        token_symbol: z.ZodString;
        token_address: z.ZodString;
        amount: z.ZodString;
        amount_usd: z.ZodOptional<z.ZodString>;
        decimals: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strict>;
    gas_estimate: z.ZodNumber;
}, z.core.$strict>;
export type RouteStep = z.infer<typeof RouteStepSchema>;
export declare const EnsoExecutionResultSchema: z.ZodObject<{
    operation_type: z.ZodString;
    status: z.ZodEnum<{
        success: "success";
        failed: "failed";
        pending: "pending";
    }>;
    input_amount: z.ZodObject<{
        token_symbol: z.ZodString;
        token_address: z.ZodString;
        amount: z.ZodString;
        amount_usd: z.ZodOptional<z.ZodString>;
        decimals: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strict>;
    output_amount: z.ZodOptional<z.ZodObject<{
        token_symbol: z.ZodString;
        token_address: z.ZodString;
        amount: z.ZodString;
        amount_usd: z.ZodOptional<z.ZodString>;
        decimals: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strict>>;
    route_taken: z.ZodArray<z.ZodObject<{
        protocol: z.ZodString;
        action: z.ZodString;
        from_token: z.ZodObject<{
            token_symbol: z.ZodString;
            token_address: z.ZodString;
            amount: z.ZodString;
            amount_usd: z.ZodOptional<z.ZodString>;
            decimals: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>;
        to_token: z.ZodObject<{
            token_symbol: z.ZodString;
            token_address: z.ZodString;
            amount: z.ZodString;
            amount_usd: z.ZodOptional<z.ZodString>;
            decimals: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>;
        gas_estimate: z.ZodNumber;
    }, z.core.$strict>>;
    steps_executed: z.ZodNumber;
    execution_time_seconds: z.ZodNumber;
    transaction: z.ZodObject<{
        tx_hash: z.ZodString;
        block_number: z.ZodNumber;
        gas_used: z.ZodNumber;
        gas_price_gwei: z.ZodString;
        total_cost_eth: z.ZodString;
        explorer_url: z.ZodString;
        status: z.ZodEnum<{
            success: "success";
            failed: "failed";
        }>;
    }, z.core.$strict>;
    total_gas_cost_usd: z.ZodString;
    price_impact: z.ZodNumber;
    effective_rate: z.ZodOptional<z.ZodString>;
    final_balance: z.ZodRecord<z.ZodString, z.ZodString>;
    apy: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodString;
    enso_route_id: z.ZodString;
    error_message: z.ZodOptional<z.ZodString>;
    retry_suggested: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
export type EnsoExecutionResult = z.infer<typeof EnsoExecutionResultSchema>;
export declare const YieldOpportunitySchema: z.ZodObject<{
    protocol: z.ZodString;
    pool_name: z.ZodString;
    token: z.ZodString;
    apy: z.ZodNumber;
    tvl: z.ZodString;
    risk_score: z.ZodNumber;
    lock_period: z.ZodNumber;
    chain: z.ZodString;
}, z.core.$strict>;
export type YieldOpportunity = z.infer<typeof YieldOpportunitySchema>;
export declare const YieldOptimizationReportSchema: z.ZodObject<{
    recommended_strategy: z.ZodObject<{
        protocol: z.ZodString;
        pool_name: z.ZodString;
        token: z.ZodString;
        apy: z.ZodNumber;
        tvl: z.ZodString;
        risk_score: z.ZodNumber;
        lock_period: z.ZodNumber;
        chain: z.ZodString;
    }, z.core.$strict>;
    alternative_strategies: z.ZodArray<z.ZodObject<{
        protocol: z.ZodString;
        pool_name: z.ZodString;
        token: z.ZodString;
        apy: z.ZodNumber;
        tvl: z.ZodString;
        risk_score: z.ZodNumber;
        lock_period: z.ZodNumber;
        chain: z.ZodString;
    }, z.core.$strict>>;
    projected_returns: z.ZodRecord<z.ZodString, z.ZodString>;
    risk_analysis: z.ZodString;
    gas_cost_estimate: z.ZodString;
    breakeven_time_days: z.ZodNumber;
}, z.core.$strict>;
export type YieldOptimizationReport = z.infer<typeof YieldOptimizationReportSchema>;
export declare const CrossChainBridgeResultSchema: z.ZodObject<{
    status: z.ZodEnum<{
        failed: "failed";
        pending: "pending";
        initiated: "initiated";
        completed: "completed";
    }>;
    from_chain: z.ZodString;
    to_chain: z.ZodString;
    from_tx_hash: z.ZodString;
    to_tx_hash: z.ZodOptional<z.ZodString>;
    bridge_protocol: z.ZodString;
    amount_sent: z.ZodObject<{
        token_symbol: z.ZodString;
        token_address: z.ZodString;
        amount: z.ZodString;
        amount_usd: z.ZodOptional<z.ZodString>;
        decimals: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strict>;
    amount_received: z.ZodOptional<z.ZodObject<{
        token_symbol: z.ZodString;
        token_address: z.ZodString;
        amount: z.ZodString;
        amount_usd: z.ZodOptional<z.ZodString>;
        decimals: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strict>>;
    bridge_fee: z.ZodString;
    estimated_arrival_time: z.ZodOptional<z.ZodString>;
    tracking_url: z.ZodString;
}, z.core.$strict>;
export type CrossChainBridgeResult = z.infer<typeof CrossChainBridgeResultSchema>;
export declare const EnsoDeFiAgentMetadataSchema: z.ZodObject<{
    agent_name: z.ZodDefault<z.ZodString>;
    version: z.ZodDefault<z.ZodString>;
    description: z.ZodDefault<z.ZodString>;
    capabilities: z.ZodDefault<z.ZodArray<z.ZodString>>;
    supported_chains: z.ZodDefault<z.ZodArray<z.ZodString>>;
    supported_operations: z.ZodDefault<z.ZodArray<z.ZodString>>;
    input_models: z.ZodDefault<z.ZodArray<z.ZodString>>;
    output_models: z.ZodDefault<z.ZodArray<z.ZodString>>;
    protocols_integrated: z.ZodDefault<z.ZodArray<z.ZodString>>;
    llm_consumable_description: z.ZodDefault<z.ZodString>;
}, z.core.$strict>;
export type EnsoDeFiAgentMetadata = z.infer<typeof EnsoDeFiAgentMetadataSchema>;
/**
 * ============================================================================
 * AKASH NETWORK COMPUTE (7.0 Crypto Operations Division)
 * ============================================================================
 */
export declare const AkashDeploymentInputSchema: z.ZodObject<{
    deployment_type: z.ZodEnum<{
        custom: "custom";
        ai_training: "ai_training";
        model_inference: "model_inference";
        api_service: "api_service";
        agent_runtime: "agent_runtime";
    }>;
    docker_image: z.ZodString;
    command: z.ZodOptional<z.ZodArray<z.ZodString>>;
    environment_variables: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    cpu_cores: z.ZodNumber;
    memory_gb: z.ZodNumber;
    storage_gb: z.ZodNumber;
    gpu_model: z.ZodOptional<z.ZodEnum<{
        NVIDIA_A100: "NVIDIA_A100";
        NVIDIA_V100: "NVIDIA_V100";
        NVIDIA_B200: "NVIDIA_B200";
        AMD_MI250: "AMD_MI250";
    }>>;
    gpu_count: z.ZodDefault<z.ZodNumber>;
    expose_ports: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    requires_public_ip: z.ZodDefault<z.ZodBoolean>;
    region_preference: z.ZodOptional<z.ZodArray<z.ZodString>>;
    max_bid_price_uakt: z.ZodOptional<z.ZodNumber>;
    auto_renewal: z.ZodDefault<z.ZodBoolean>;
    duration_hours: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export type AkashDeploymentInput = z.infer<typeof AkashDeploymentInputSchema>;
export declare const AITrainingJobInputSchema: z.ZodObject<{
    model_type: z.ZodEnum<{
        transformer: "transformer";
        cnn: "cnn";
        gan: "gan";
        diffusion: "diffusion";
        reinforcement_learning: "reinforcement_learning";
    }>;
    training_data_url: z.ZodString;
    model_config_url: z.ZodOptional<z.ZodString>;
    framework: z.ZodDefault<z.ZodEnum<{
        custom: "custom";
        pytorch: "pytorch";
        tensorflow: "tensorflow";
        jax: "jax";
    }>>;
    checkpoint_url: z.ZodOptional<z.ZodString>;
    epochs: z.ZodNumber;
    batch_size: z.ZodDefault<z.ZodNumber>;
    gpu_required: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
export type AITrainingJobInput = z.infer<typeof AITrainingJobInputSchema>;
export declare const InferenceServiceInputSchema: z.ZodObject<{
    model_url: z.ZodString;
    framework: z.ZodEnum<{
        custom: "custom";
        pytorch: "pytorch";
        tensorflow: "tensorflow";
        onnx: "onnx";
    }>;
    api_type: z.ZodDefault<z.ZodEnum<{
        rest: "rest";
        grpc: "grpc";
        websocket: "websocket";
    }>>;
    max_concurrent_requests: z.ZodDefault<z.ZodNumber>;
    input_schema: z.ZodRecord<z.ZodString, z.ZodString>;
    output_schema: z.ZodRecord<z.ZodString, z.ZodString>;
}, z.core.$strict>;
export type InferenceServiceInput = z.infer<typeof InferenceServiceInputSchema>;
export declare const AkashProviderInfoSchema: z.ZodObject<{
    provider_address: z.ZodString;
    region: z.ZodString;
    datacenter: z.ZodString;
    available_resources: z.ZodRecord<z.ZodString, z.ZodNumber>;
    reputation_score: z.ZodNumber;
    uptime_percentage: z.ZodNumber;
}, z.core.$strict>;
export type AkashProviderInfo = z.infer<typeof AkashProviderInfoSchema>;
export declare const DeploymentResultSchema: z.ZodObject<{
    deployment_id: z.ZodString;
    status: z.ZodEnum<{
        failed: "failed";
        pending: "pending";
        active: "active";
        closed: "closed";
    }>;
    provider: z.ZodObject<{
        provider_address: z.ZodString;
        region: z.ZodString;
        datacenter: z.ZodString;
        available_resources: z.ZodRecord<z.ZodString, z.ZodNumber>;
        reputation_score: z.ZodNumber;
        uptime_percentage: z.ZodNumber;
    }, z.core.$strict>;
    lease_id: z.ZodString;
    public_endpoints: z.ZodDefault<z.ZodArray<z.ZodString>>;
    internal_hostname: z.ZodString;
    ssh_access: z.ZodOptional<z.ZodString>;
    resources_allocated: z.ZodRecord<z.ZodString, z.ZodString>;
    cpu_cores: z.ZodNumber;
    memory_gb: z.ZodNumber;
    storage_gb: z.ZodNumber;
    gpu_model: z.ZodOptional<z.ZodString>;
    gpu_count: z.ZodNumber;
    cost_per_hour_uakt: z.ZodNumber;
    cost_per_hour_usd: z.ZodString;
    deposit_paid_uakt: z.ZodNumber;
    estimated_monthly_cost_usd: z.ZodString;
    docker_image: z.ZodString;
    created_at: z.ZodString;
    expires_at: z.ZodOptional<z.ZodString>;
    auto_renewal: z.ZodBoolean;
    health_check_url: z.ZodOptional<z.ZodString>;
    logs_url: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type DeploymentResult = z.infer<typeof DeploymentResultSchema>;
export declare const TrainingJobResultSchema: z.ZodObject<{
    job_id: z.ZodString;
    status: z.ZodEnum<{
        failed: "failed";
        completed: "completed";
        stopped: "stopped";
    }>;
    final_loss: z.ZodNumber;
    final_accuracy: z.ZodOptional<z.ZodNumber>;
    epochs_completed: z.ZodNumber;
    training_time_hours: z.ZodNumber;
    model_checkpoint_url: z.ZodString;
    tensorboard_logs_url: z.ZodOptional<z.ZodString>;
    metrics_json_url: z.ZodString;
    samples_processed: z.ZodNumber;
    iterations: z.ZodNumber;
    gpu_hours_used: z.ZodNumber;
    compute_cost_akt: z.ZodString;
    compute_cost_usd: z.ZodString;
    cost_per_epoch: z.ZodString;
    throughput_samples_per_second: z.ZodNumber;
    gpu_utilization_avg: z.ZodNumber;
}, z.core.$strict>;
export type TrainingJobResult = z.infer<typeof TrainingJobResultSchema>;
export declare const InferenceAPIResultSchema: z.ZodObject<{
    service_id: z.ZodString;
    api_endpoint: z.ZodString;
    api_key: z.ZodString;
    model_info: z.ZodRecord<z.ZodString, z.ZodString>;
    framework: z.ZodString;
    api_type: z.ZodString;
    max_throughput_rps: z.ZodNumber;
    average_latency_ms: z.ZodNumber;
    cold_start_time_ms: z.ZodNumber;
    api_docs_url: z.ZodString;
    example_request: z.ZodRecord<z.ZodString, z.ZodString>;
    example_response: z.ZodRecord<z.ZodString, z.ZodString>;
    cost_per_1k_requests: z.ZodString;
    monthly_base_cost_usd: z.ZodString;
}, z.core.$strict>;
export type InferenceAPIResult = z.infer<typeof InferenceAPIResultSchema>;
export declare const AkashComputeAgentMetadataSchema: z.ZodObject<{
    agent_name: z.ZodDefault<z.ZodString>;
    version: z.ZodDefault<z.ZodString>;
    description: z.ZodDefault<z.ZodString>;
    capabilities: z.ZodDefault<z.ZodArray<z.ZodString>>;
    supported_gpu_models: z.ZodDefault<z.ZodArray<z.ZodString>>;
    typical_deployments: z.ZodDefault<z.ZodArray<z.ZodString>>;
    input_models: z.ZodDefault<z.ZodArray<z.ZodString>>;
    output_models: z.ZodDefault<z.ZodArray<z.ZodString>>;
    cost_advantages: z.ZodDefault<z.ZodArray<z.ZodString>>;
    llm_consumable_description: z.ZodDefault<z.ZodString>;
}, z.core.$strict>;
export type AkashComputeAgentMetadata = z.infer<typeof AkashComputeAgentMetadataSchema>;
/**
 * ============================================================================
 * ARWEAVE & AO MEMORY (7.0 Crypto Operations Division)
 * ============================================================================
 */
export declare const ArweaveStorageInputSchema: z.ZodObject<{
    data_type: z.ZodEnum<{
        audit_log: "audit_log";
        agent_state: "agent_state";
        nft_metadata: "nft_metadata";
        document: "document";
        binary: "binary";
    }>;
    content: z.ZodString;
    tags: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    content_type: z.ZodDefault<z.ZodString>;
    encrypt: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
export type ArweaveStorageInput = z.infer<typeof ArweaveStorageInputSchema>;
export declare const AuditLogEntrySchema: z.ZodObject<{
    event_type: z.ZodString;
    event_data: z.ZodRecord<z.ZodString, z.ZodAny>;
    actor: z.ZodString;
    timestamp: z.ZodString;
    severity: z.ZodDefault<z.ZodEnum<{
        error: "error";
        info: "info";
        warning: "warning";
        critical: "critical";
    }>>;
    tags: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$strict>;
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;
export declare const AOStateManagementInputSchema: z.ZodObject<{
    process_id: z.ZodString;
    action: z.ZodEnum<{
        save_state: "save_state";
        load_state: "load_state";
        update_state: "update_state";
        delete_state: "delete_state";
    }>;
    state_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    state_key: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type AOStateManagementInput = z.infer<typeof AOStateManagementInputSchema>;
export declare const MemoryQueryInputSchema: z.ZodObject<{
    query_type: z.ZodEnum<{
        by_tag: "by_tag";
        by_address: "by_address";
        by_transaction: "by_transaction";
        by_content: "by_content";
    }>;
    filters: z.ZodRecord<z.ZodString, z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort_order: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strict>;
export type MemoryQueryInput = z.infer<typeof MemoryQueryInputSchema>;
export declare const ArweaveTransactionSchema: z.ZodObject<{
    tx_id: z.ZodString;
    data_hash: z.ZodString;
    data_size_bytes: z.ZodNumber;
    block_height: z.ZodOptional<z.ZodNumber>;
    confirmations: z.ZodDefault<z.ZodNumber>;
    gateway_url: z.ZodString;
    explorer_url: z.ZodString;
    cost_ar: z.ZodString;
    cost_usd: z.ZodString;
    cost_per_mb: z.ZodString;
    tags: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    content_type: z.ZodString;
    timestamp: z.ZodString;
    permanent: z.ZodDefault<z.ZodBoolean>;
    retrievable: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
export type ArweaveTransaction = z.infer<typeof ArweaveTransactionSchema>;
export declare const StorageResultSchema: z.ZodObject<{
    status: z.ZodEnum<{
        failed: "failed";
        pending: "pending";
        confirmed: "confirmed";
    }>;
    transaction: z.ZodObject<{
        tx_id: z.ZodString;
        data_hash: z.ZodString;
        data_size_bytes: z.ZodNumber;
        block_height: z.ZodOptional<z.ZodNumber>;
        confirmations: z.ZodDefault<z.ZodNumber>;
        gateway_url: z.ZodString;
        explorer_url: z.ZodString;
        cost_ar: z.ZodString;
        cost_usd: z.ZodString;
        cost_per_mb: z.ZodString;
        tags: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        content_type: z.ZodString;
        timestamp: z.ZodString;
        permanent: z.ZodDefault<z.ZodBoolean>;
        retrievable: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>;
    data_url: z.ZodString;
    ipfs_mirror: z.ZodOptional<z.ZodString>;
    data_hash: z.ZodString;
    signature: z.ZodString;
    estimated_lifespan_years: z.ZodDefault<z.ZodNumber>;
}, z.core.$strict>;
export type StorageResult = z.infer<typeof StorageResultSchema>;
export declare const AOProcessStateSchema: z.ZodObject<{
    process_id: z.ZodString;
    state_version: z.ZodNumber;
    state_data: z.ZodRecord<z.ZodString, z.ZodAny>;
    last_updated: z.ZodString;
    updated_by: z.ZodString;
    state_size_kb: z.ZodNumber;
    message_id: z.ZodString;
    arweave_tx_id: z.ZodString;
    state_hash: z.ZodString;
    merkle_root: z.ZodString;
}, z.core.$strict>;
export type AOProcessState = z.infer<typeof AOProcessStateSchema>;
export declare const AuditLogResultSchema: z.ZodObject<{
    log_id: z.ZodString;
    stored_on_arweave: z.ZodBoolean;
    arweave_tx: z.ZodOptional<z.ZodObject<{
        tx_id: z.ZodString;
        data_hash: z.ZodString;
        data_size_bytes: z.ZodNumber;
        block_height: z.ZodOptional<z.ZodNumber>;
        confirmations: z.ZodDefault<z.ZodNumber>;
        gateway_url: z.ZodString;
        explorer_url: z.ZodString;
        cost_ar: z.ZodString;
        cost_usd: z.ZodString;
        cost_per_mb: z.ZodString;
        tags: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        content_type: z.ZodString;
        timestamp: z.ZodString;
        permanent: z.ZodDefault<z.ZodBoolean>;
        retrievable: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>>;
    event_type: z.ZodString;
    timestamp: z.ZodString;
    severity: z.ZodString;
    immutable: z.ZodDefault<z.ZodBoolean>;
    tamper_proof: z.ZodDefault<z.ZodBoolean>;
    cryptographically_signed: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
export type AuditLogResult = z.infer<typeof AuditLogResultSchema>;
export declare const QueryResultSchema: z.ZodObject<{
    query_type: z.ZodString;
    results_found: z.ZodNumber;
    transactions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        tx_id: z.ZodString;
        data_hash: z.ZodString;
        data_size_bytes: z.ZodNumber;
        block_height: z.ZodOptional<z.ZodNumber>;
        confirmations: z.ZodDefault<z.ZodNumber>;
        gateway_url: z.ZodString;
        explorer_url: z.ZodString;
        cost_ar: z.ZodString;
        cost_usd: z.ZodString;
        cost_per_mb: z.ZodString;
        tags: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        content_type: z.ZodString;
        timestamp: z.ZodString;
        permanent: z.ZodDefault<z.ZodBoolean>;
        retrievable: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>>>;
    query_time_ms: z.ZodNumber;
    cache_hit: z.ZodDefault<z.ZodBoolean>;
    has_more: z.ZodDefault<z.ZodBoolean>;
    next_cursor: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type QueryResult = z.infer<typeof QueryResultSchema>;
export declare const DataRetrievalResultSchema: z.ZodObject<{
    tx_id: z.ZodString;
    content: z.ZodString;
    content_type: z.ZodString;
    data_hash: z.ZodString;
    hash_verified: z.ZodBoolean;
    signature_verified: z.ZodBoolean;
    tags: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    block_height: z.ZodNumber;
    age_days: z.ZodNumber;
    retrieval_time_ms: z.ZodNumber;
    source: z.ZodEnum<{
        gateway: "gateway";
        cache: "cache";
        peer: "peer";
    }>;
}, z.core.$strict>;
export type DataRetrievalResult = z.infer<typeof DataRetrievalResultSchema>;
export declare const ArweaveMemoryAgentMetadataSchema: z.ZodObject<{
    agent_name: z.ZodDefault<z.ZodString>;
    version: z.ZodDefault<z.ZodString>;
    description: z.ZodDefault<z.ZodString>;
    capabilities: z.ZodDefault<z.ZodArray<z.ZodString>>;
    storage_guarantees: z.ZodDefault<z.ZodArray<z.ZodString>>;
    typical_use_cases: z.ZodDefault<z.ZodArray<z.ZodString>>;
    input_models: z.ZodDefault<z.ZodArray<z.ZodString>>;
    output_models: z.ZodDefault<z.ZodArray<z.ZodString>>;
    integration_notes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    llm_consumable_description: z.ZodDefault<z.ZodString>;
}, z.core.$strict>;
export type ArweaveMemoryAgentMetadata = z.infer<typeof ArweaveMemoryAgentMetadataSchema>;
/**
 * ============================================================================
 * RENDER NETWORK (7.0 Crypto Operations Division)
 * ============================================================================
 */
export declare const RenderJobInputSchema: z.ZodObject<{
    job_type: z.ZodEnum<{
        "3d_generation": "3d_generation";
        image_generation: "image_generation";
        video_render: "video_render";
        vfx_composite: "vfx_composite";
    }>;
    prompt: z.ZodOptional<z.ZodString>;
    scene_file_url: z.ZodOptional<z.ZodString>;
    engine: z.ZodDefault<z.ZodEnum<{
        StabilityAI: "StabilityAI";
        Blender: "Blender";
        Houdini: "Houdini";
        Unreal: "Unreal";
        Custom: "Custom";
    }>>;
    output_format: z.ZodEnum<{
        png: "png";
        jpg: "jpg";
        glb: "glb";
        gltf: "gltf";
        fbx: "fbx";
        mp4: "mp4";
        exr: "exr";
    }>;
    resolution: z.ZodDefault<z.ZodString>;
    quality: z.ZodDefault<z.ZodEnum<{
        medium: "medium";
        high: "high";
        draft: "draft";
        production: "production";
    }>>;
    samples: z.ZodDefault<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodEnum<{
        low: "low";
        high: "high";
        normal: "normal";
        urgent: "urgent";
    }>>;
}, z.core.$strict>;
export type RenderJobInput = z.infer<typeof RenderJobInputSchema>;
export declare const Image3DGenerationInputSchema: z.ZodObject<{
    description: z.ZodString;
    style: z.ZodDefault<z.ZodEnum<{
        realistic: "realistic";
        stylized: "stylized";
        low_poly: "low_poly";
        photorealistic: "photorealistic";
    }>>;
    output_format: z.ZodDefault<z.ZodEnum<{
        glb: "glb";
        gltf: "gltf";
        fbx: "fbx";
        obj: "obj";
    }>>;
    include_textures: z.ZodDefault<z.ZodBoolean>;
    polycount_target: z.ZodDefault<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>>;
}, z.core.$strict>;
export type Image3DGenerationInput = z.infer<typeof Image3DGenerationInputSchema>;
export declare const ImageGenerationInputSchema: z.ZodObject<{
    prompt: z.ZodString;
    negative_prompt: z.ZodOptional<z.ZodString>;
    style: z.ZodOptional<z.ZodString>;
    aspect_ratio: z.ZodDefault<z.ZodEnum<{
        "1:1": "1:1";
        "16:9": "16:9";
        "4:3": "4:3";
        "3:2": "3:2";
        "9:16": "9:16";
    }>>;
    quality: z.ZodDefault<z.ZodEnum<{
        high: "high";
        draft: "draft";
        standard: "standard";
        ultra: "ultra";
    }>>;
    num_images: z.ZodDefault<z.ZodNumber>;
}, z.core.$strict>;
export type ImageGenerationInput = z.infer<typeof ImageGenerationInputSchema>;
export declare const RenderAssetSchema: z.ZodObject<{
    asset_id: z.ZodString;
    asset_url: z.ZodString;
    asset_type: z.ZodString;
    file_size_mb: z.ZodNumber;
    resolution: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    thumbnail_url: z.ZodOptional<z.ZodString>;
    ipfs_hash: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type RenderAsset = z.infer<typeof RenderAssetSchema>;
export declare const RenderJobResultSchema: z.ZodObject<{
    job_id: z.ZodString;
    status: z.ZodEnum<{
        failed: "failed";
        completed: "completed";
        cancelled: "cancelled";
    }>;
    primary_asset: z.ZodObject<{
        asset_id: z.ZodString;
        asset_url: z.ZodString;
        asset_type: z.ZodString;
        file_size_mb: z.ZodNumber;
        resolution: z.ZodString;
        metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        thumbnail_url: z.ZodOptional<z.ZodString>;
        ipfs_hash: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    additional_assets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        asset_id: z.ZodString;
        asset_url: z.ZodString;
        asset_type: z.ZodString;
        file_size_mb: z.ZodNumber;
        resolution: z.ZodString;
        metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        thumbnail_url: z.ZodOptional<z.ZodString>;
        ipfs_hash: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    engine_used: z.ZodString;
    render_time_seconds: z.ZodNumber;
    gpu_used: z.ZodString;
    render_nodes: z.ZodNumber;
    compute_cost_rndr: z.ZodString;
    compute_cost_usd: z.ZodString;
    cost_per_second: z.ZodString;
    quality_score: z.ZodOptional<z.ZodNumber>;
    artifacts_detected: z.ZodDefault<z.ZodArray<z.ZodString>>;
    submitted_at: z.ZodString;
    started_at: z.ZodString;
    completed_at: z.ZodString;
    error_message: z.ZodOptional<z.ZodString>;
    partial_results: z.ZodDefault<z.ZodArray<z.ZodObject<{
        asset_id: z.ZodString;
        asset_url: z.ZodString;
        asset_type: z.ZodString;
        file_size_mb: z.ZodNumber;
        resolution: z.ZodString;
        metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        thumbnail_url: z.ZodOptional<z.ZodString>;
        ipfs_hash: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type RenderJobResult = z.infer<typeof RenderJobResultSchema>;
export declare const GeneratedModel3DSchema: z.ZodObject<{
    model_id: z.ZodString;
    description: z.ZodString;
    model_url: z.ZodString;
    model_format: z.ZodString;
    texture_urls: z.ZodDefault<z.ZodArray<z.ZodString>>;
    polygon_count: z.ZodNumber;
    vertex_count: z.ZodNumber;
    has_animations: z.ZodDefault<z.ZodBoolean>;
    has_rigging: z.ZodDefault<z.ZodBoolean>;
    preview_images: z.ZodArray<z.ZodString>;
    turntable_video: z.ZodOptional<z.ZodString>;
    bounding_box: z.ZodRecord<z.ZodString, z.ZodNumber>;
    file_size_mb: z.ZodNumber;
    generation_time_seconds: z.ZodNumber;
    cost_usd: z.ZodString;
}, z.core.$strict>;
export type GeneratedModel3D = z.infer<typeof GeneratedModel3DSchema>;
export declare const GPUResourceUsageSchema: z.ZodObject<{
    gpu_model: z.ZodString;
    gpu_memory_used_gb: z.ZodNumber;
    compute_time_seconds: z.ZodNumber;
    power_usage_kwh: z.ZodNumber;
    carbon_offset_kg: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export type GPUResourceUsage = z.infer<typeof GPUResourceUsageSchema>;
export declare const RenderNetworkAgentMetadataSchema: z.ZodObject<{
    agent_name: z.ZodDefault<z.ZodString>;
    version: z.ZodDefault<z.ZodString>;
    description: z.ZodDefault<z.ZodString>;
    capabilities: z.ZodDefault<z.ZodArray<z.ZodString>>;
    supported_engines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    supported_formats: z.ZodDefault<z.ZodArray<z.ZodString>>;
    input_models: z.ZodDefault<z.ZodArray<z.ZodString>>;
    output_models: z.ZodDefault<z.ZodArray<z.ZodString>>;
    typical_use_cases: z.ZodDefault<z.ZodArray<z.ZodString>>;
    llm_consumable_description: z.ZodDefault<z.ZodString>;
}, z.core.$strict>;
export type RenderNetworkAgentMetadata = z.infer<typeof RenderNetworkAgentMetadataSchema>;
//# sourceMappingURL=crypto.d.ts.map