"""
Akash Network Compute Agent

This agent handles general-purpose decentralized compute using Akash Network,
the "Supercloud" for AI training, model inference, and sovereign agent hosting.

Division: 7.0 Crypto Operations
Protocol: Akash Network (Layer 3 - Compute)
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict, Optional, Literal
from datetime import datetime

# ===== Input Models =====

class AkashDeploymentInput(BaseModel):
    """
    Input for deploying a workload to Akash Network.
    """
    deployment_type: Literal["ai_training", "model_inference", "api_service", "agent_runtime", "custom"] = Field(
        ...,
        description="Type of compute workload"
    )
    docker_image: str = Field(..., description="Docker image to deploy (e.g., 'pytorch/pytorch:latest')")
    command: Optional[List[str]] = Field(None, description="Command to run in container")
    environment_variables: Dict[str, str] = Field(default_factory=dict, description="Environment variables")

    # Resource requirements
    cpu_cores: int = Field(..., ge=1, le=128, description="Number of CPU cores")
    memory_gb: int = Field(..., ge=1, le=512, description="Memory in GB")
    storage_gb: int = Field(..., ge=10, le=10000, description="Persistent storage in GB")
    gpu_model: Optional[Literal["NVIDIA_A100", "NVIDIA_V100", "NVIDIA_B200", "AMD_MI250"]] = Field(
        None,
        description="GPU model (optional)"
    )
    gpu_count: int = Field(0, ge=0, le=8, description="Number of GPUs")

    # Networking
    expose_ports: List[int] = Field(default_factory=list, description="Ports to expose")
    requires_public_ip: bool = Field(False, description="Whether deployment needs public IP")

    # Deployment settings
    region_preference: Optional[List[str]] = Field(None, description="Preferred data center regions")
    max_bid_price_uakt: Optional[int] = Field(None, description="Maximum bid price in uAKT")
    auto_renewal: bool = Field(True, description="Automatically renew deployment")
    duration_hours: Optional[int] = Field(None, ge=1, le=8760, description="Deployment duration (None for indefinite)")


class AITrainingJobInput(BaseModel):
    """
    Simplified input for AI model training workloads.
    """
    model_type: Literal["transformer", "cnn", "gan", "diffusion", "reinforcement_learning"] = Field(
        ...,
        description="Type of AI model to train"
    )
    training_data_url: HttpUrl = Field(..., description="URL to training dataset")
    model_config_url: Optional[HttpUrl] = Field(None, description="URL to model configuration file")
    framework: Literal["pytorch", "tensorflow", "jax", "custom"] = Field("pytorch", description="ML framework")
    checkpoint_url: Optional[HttpUrl] = Field(None, description="URL to resume from checkpoint")
    epochs: int = Field(..., ge=1, le=1000, description="Number of training epochs")
    batch_size: int = Field(32, ge=1, le=512, description="Training batch size")
    gpu_required: bool = Field(True, description="Whether GPU is required")


class InferenceServiceInput(BaseModel):
    """
    Input for deploying an AI inference API service.
    """
    model_url: HttpUrl = Field(..., description="URL to trained model weights")
    framework: Literal["pytorch", "tensorflow", "onnx", "custom"] = Field(..., description="Model framework")
    api_type: Literal["rest", "grpc", "websocket"] = Field("rest", description="API protocol")
    max_concurrent_requests: int = Field(10, ge=1, le=100, description="Max concurrent inference requests")
    input_schema: Dict[str, str] = Field(..., description="API input schema")
    output_schema: Dict[str, str] = Field(..., description="API output schema")


# ===== Output Models =====

class AkashProviderInfo(BaseModel):
    """
    Information about an Akash compute provider.
    """
    provider_address: str = Field(..., description="Akash provider wallet address")
    region: str = Field(..., description="Geographic region")
    datacenter: str = Field(..., description="Data center name")
    available_resources: Dict[str, int] = Field(..., description="Available compute resources")
    reputation_score: float = Field(..., ge=0.0, le=10.0, description="Provider reputation")
    uptime_percentage: float = Field(..., ge=0.0, le=100.0, description="Historical uptime")


class DeploymentResult(BaseModel):
    """
    Result of an Akash deployment.
    """
    deployment_id: str = Field(..., description="Unique deployment identifier")
    status: Literal["active", "pending", "failed", "closed"] = Field(..., description="Deployment status")

    # Provider details
    provider: AkashProviderInfo = Field(..., description="Assigned compute provider")
    lease_id: str = Field(..., description="Lease identifier")

    # Access information
    public_endpoints: List[str] = Field(default_factory=list, description="Public endpoint URLs")
    internal_hostname: str = Field(..., description="Internal hostname for service")
    ssh_access: Optional[str] = Field(None, description="SSH access command (if enabled)")

    # Resource allocation
    resources_allocated: Dict[str, str] = Field(..., description="Actual resources allocated")
    cpu_cores: int
    memory_gb: int
    storage_gb: int
    gpu_model: Optional[str]
    gpu_count: int

    # Cost information
    cost_per_hour_uakt: int = Field(..., description="Hourly cost in micro-AKT")
    cost_per_hour_usd: str = Field(..., description="Hourly cost in USD")
    deposit_paid_uakt: int = Field(..., description="Deposit paid")
    estimated_monthly_cost_usd: str = Field(..., description="Estimated monthly cost")

    # Deployment details
    docker_image: str = Field(..., description="Docker image deployed")
    created_at: datetime = Field(..., description="Deployment creation time")
    expires_at: Optional[datetime] = Field(None, description="Deployment expiration time")
    auto_renewal: bool

    # Monitoring
    health_check_url: Optional[str] = Field(None, description="Health check endpoint")
    logs_url: Optional[str] = Field(None, description="URL to view logs")


class TrainingJobResult(BaseModel):
    """
    Result of a completed AI training job.
    """
    job_id: str = Field(..., description="Training job identifier")
    status: Literal["completed", "failed", "stopped"] = Field(..., description="Job status")

    # Training results
    final_loss: float = Field(..., description="Final training loss")
    final_accuracy: Optional[float] = Field(None, description="Final accuracy metric")
    epochs_completed: int = Field(..., description="Number of epochs completed")
    training_time_hours: float = Field(..., description="Total training time")

    # Model artifacts
    model_checkpoint_url: HttpUrl = Field(..., description="URL to trained model checkpoint")
    tensorboard_logs_url: Optional[HttpUrl] = Field(None, description="URL to TensorBoard logs")
    metrics_json_url: HttpUrl = Field(..., description="URL to training metrics JSON")

    # Training metrics
    samples_processed: int = Field(..., description="Total training samples processed")
    iterations: int = Field(..., description="Total training iterations")
    gpu_hours_used: float = Field(..., description="GPU hours consumed")

    # Cost breakdown
    compute_cost_akt: str = Field(..., description="Total cost in AKT")
    compute_cost_usd: str = Field(..., description="Total cost in USD")
    cost_per_epoch: str = Field(..., description="Average cost per epoch")

    # Performance metrics
    throughput_samples_per_second: float = Field(..., description="Training throughput")
    gpu_utilization_avg: float = Field(..., ge=0.0, le=100.0, description="Average GPU utilization percentage")


class InferenceAPIResult(BaseModel):
    """
    Details of a deployed inference API service.
    """
    service_id: str = Field(..., description="Service identifier")
    api_endpoint: HttpUrl = Field(..., description="Public API endpoint URL")
    api_key: str = Field(..., description="API key for authentication")

    # Service details
    model_info: Dict[str, str] = Field(..., description="Deployed model information")
    framework: str = Field(..., description="ML framework")
    api_type: str = Field(..., description="API protocol")

    # Performance
    max_throughput_rps: int = Field(..., description="Maximum requests per second")
    average_latency_ms: float = Field(..., description="Average inference latency")
    cold_start_time_ms: float = Field(..., description="Cold start latency")

    # Documentation
    api_docs_url: HttpUrl = Field(..., description="API documentation URL")
    example_request: Dict[str, str] = Field(..., description="Example API request")
    example_response: Dict[str, str] = Field(..., description="Example API response")

    # Costs
    cost_per_1k_requests: str = Field(..., description="Cost per 1,000 inference requests")
    monthly_base_cost_usd: str = Field(..., description="Base hosting cost per month")


# ===== Agent Metadata =====

class AkashComputeAgentMetadata(BaseModel):
    """
    Metadata describing the Akash Network Agent's capabilities.
    """
    agent_name: str = "akash-compute-agent"
    version: str = "1.0.0"
    description: str = Field(
        default="Deploys and manages general-purpose compute workloads on Akash Network, "
        "the decentralized cloud. Specializes in AI/ML training, model inference APIs, "
        "sovereign agent hosting, and any Docker-based workload. Provides access to "
        "high-end NVIDIA GPUs at a fraction of cloud provider costs."
    )

    capabilities: List[str] = Field(default=[
        "AI model training (LLMs, vision models, etc.)",
        "Model inference API deployment",
        "Containerized application hosting",
        "Sovereign AI agent runtime",
        "GPU compute for any workload",
        "Custom Docker deployments",
        "Auto-scaling services",
        "Global deployment regions"
    ])

    supported_gpu_models: List[str] = Field(default=[
        "NVIDIA H100",
        "NVIDIA A100",
        "NVIDIA V100",
        "NVIDIA B200 (Blackwell)",
        "AMD MI250"
    ])

    typical_deployments: List[str] = Field(default=[
        "Large language model training",
        "Stable Diffusion fine-tuning",
        "Autonomous agent hosting",
        "API microservices",
        "Data processing pipelines",
        "Web application backends"
    ])

    input_models: List[str] = Field(default=[
        "AkashDeploymentInput",
        "AITrainingJobInput",
        "InferenceServiceInput"
    ])

    output_models: List[str] = Field(default=[
        "DeploymentResult",
        "TrainingJobResult",
        "InferenceAPIResult"
    ])

    cost_advantages: List[str] = Field(default=[
        "60-80% cheaper than AWS/GCP/Azure",
        "No vendor lock-in",
        "Pay-per-use pricing",
        "Decentralized marketplace",
        "Competitive bidding"
    ])

    llm_consumable_description: str = Field(
        default="I deploy and manage compute workloads on Akash Network's decentralized cloud. "
        "Tell me what you need to run (e.g., 'Train a Llama-2 model', 'Deploy a FastAPI service', "
        "'Host a Stable Diffusion API') and I'll provision the resources, handle deployment, "
        "and provide access endpoints. Perfect for AI training, inference APIs, and hosting "
        "autonomous agents at 60-80% lower cost than traditional clouds."
    )
