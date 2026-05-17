# Transitional compatibility layer for crypto Pydantic imports.
from pathlib import Path
import sys

_REPO_ROOT = Path(__file__).resolve().parents[5]
_LEGACY_CRYPTO_DIR = _REPO_ROOT / "packages" / "extension-system" / "src" / "agents" / "pydantic" / "7.0_crypto_operations_division"

if str(_LEGACY_CRYPTO_DIR) not in sys.path:
    sys.path.insert(0, str(_LEGACY_CRYPTO_DIR))

from enso_defi_agent import (
    EnsoDeFiInput,
    TokenSwapInput,
    YieldStakingInput,
    CrossChainBridgeInput,
    EnsoExecutionResult,
    YieldOptimizationReport,
    CrossChainBridgeResult,
    EnsoDeFiAgentMetadata,
)
from render_network_agent import (
    RenderJobInput,
    Image3DGenerationInput,
    ImageGenerationInput,
    RenderJobResult,
    GeneratedModel3D,
    RenderNetworkAgentMetadata,
)
from akash_compute_agent import (
    AkashDeploymentInput,
    AITrainingJobInput,
    InferenceServiceInput,
    DeploymentResult,
    TrainingJobResult,
    InferenceAPIResult,
    AkashComputeAgentMetadata,
)
from arweave_memory_agent import (
    ArweaveStorageInput,
    AuditLogEntry,
    AOStateManagementInput,
    MemoryQueryInput,
    StorageResult,
    AuditLogResult,
    AOProcessState,
    QueryResult,
    DataRetrievalResult,
    ArweaveMemoryAgentMetadata,
)

__all__ = [
    "EnsoDeFiInput",
    "TokenSwapInput",
    "YieldStakingInput",
    "CrossChainBridgeInput",
    "EnsoExecutionResult",
    "YieldOptimizationReport",
    "CrossChainBridgeResult",
    "EnsoDeFiAgentMetadata",
    "RenderJobInput",
    "Image3DGenerationInput",
    "ImageGenerationInput",
    "RenderJobResult",
    "GeneratedModel3D",
    "RenderNetworkAgentMetadata",
    "AkashDeploymentInput",
    "AITrainingJobInput",
    "InferenceServiceInput",
    "DeploymentResult",
    "TrainingJobResult",
    "InferenceAPIResult",
    "AkashComputeAgentMetadata",
    "ArweaveStorageInput",
    "AuditLogEntry",
    "AOStateManagementInput",
    "MemoryQueryInput",
    "StorageResult",
    "AuditLogResult",
    "AOProcessState",
    "QueryResult",
    "DataRetrievalResult",
    "ArweaveMemoryAgentMetadata",
]
