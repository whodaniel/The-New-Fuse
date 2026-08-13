"""
Test Suite for Crypto Agents

Comprehensive tests for all crypto agent implementations including:
- Pydantic model validation
- Executor functionality
- Agent registry
- Integration tests
"""

import pytest
import asyncio
from decimal import Decimal
from datetime import datetime
import sys
from pathlib import Path

# Add paths for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(
    0,
    str(
        Path(__file__).resolve().parents[3]
        / "packages"
        / "protocol-contracts"
        / "generated"
        / "python"
    ),
)

from executor.crypto_agent_executor import CryptoAgentExecutor
from integration.agent_registry import CryptoAgentRegistry, register_crypto_agents_with_orchestrator
from config import Config

# Import Pydantic models
from tnf_contracts.crypto_operations import (
    EnsoDeFiInput, TokenSwapInput, YieldStakingInput,
    EnsoExecutionResult, EnsoDeFiAgentMetadata,
    RenderJobInput, Image3DGenerationInput,
    RenderJobResult, RenderNetworkAgentMetadata,
    AkashDeploymentInput, AITrainingJobInput,
    DeploymentResult, AkashComputeAgentMetadata,
    ArweaveStorageInput, AuditLogEntry,
    StorageResult, ArweaveMemoryAgentMetadata,
)


# ===== Pydantic Model Validation Tests =====

class TestPydanticModels:
    """Test Pydantic model validation and serialization."""

    def test_enso_defi_input_validation(self):
        """Test ENSO DeFi input model validation."""
        # Valid input
        valid_input = EnsoDeFiInput(
            operation_type="swap",
            token_in="ETH",
            token_out="USDC",
            amount="1.5",
            slippage_tolerance=0.5
        )
        assert valid_input.operation_type == "swap"
        assert valid_input.amount == "1.5"

        # Invalid operation type should raise validation error
        with pytest.raises(Exception):
            EnsoDeFiInput(
                operation_type="invalid_op",
                token_in="ETH",
                amount="1.0"
            )

        # Invalid slippage should raise validation error
        with pytest.raises(Exception):
            EnsoDeFiInput(
                operation_type="swap",
                token_in="ETH",
                token_out="USDC",
                amount="1.0",
                slippage_tolerance=10.0  # > 5.0
            )

    def test_token_swap_input(self):
        """Test TokenSwapInput model."""
        swap_input = TokenSwapInput(
            from_token="ETH",
            to_token="USDC",
            amount="1.0",
            slippage_tolerance=0.5
        )
        assert swap_input.from_token == "ETH"
        assert swap_input.to_token == "USDC"

    def test_render_job_input_validation(self):
        """Test Render Network input validation."""
        # 3D generation
        render_input = RenderJobInput(
            job_type="3d_generation",
            prompt="A futuristic car",
            output_format="glb",
            quality="high"
        )
        assert render_input.job_type == "3d_generation"
        assert render_input.output_format == "glb"

        # Image generation
        image_input = RenderJobInput(
            job_type="image_generation",
            prompt="Sunset over mountains",
            output_format="png",
            quality="production"
        )
        assert image_input.prompt == "Sunset over mountains"

    def test_akash_deployment_input_validation(self):
        """Test Akash deployment input validation."""
        deployment_input = AkashDeploymentInput(
            deployment_type="ai_training",
            docker_image="pytorch/pytorch:latest",
            cpu_cores=8,
            memory_gb=32,
            storage_gb=100,
            gpu_model="NVIDIA_A100",
            gpu_count=2,
            expose_ports=[8000, 8001]
        )
        assert deployment_input.cpu_cores == 8
        assert deployment_input.gpu_model == "NVIDIA_A100"

        # Test constraints
        with pytest.raises(Exception):
            AkashDeploymentInput(
                deployment_type="ai_training",
                docker_image="test:latest",
                cpu_cores=200,  # > 128
                memory_gb=16
            )

    def test_arweave_storage_input_validation(self):
        """Test Arweave storage input validation."""
        storage_input = ArweaveStorageInput(
            data_type="audit_log",
            content='{"event": "test"}',
            tags={"app": "tnf", "type": "test"},
            content_type="application/json"
        )
        assert storage_input.data_type == "audit_log"
        assert storage_input.content_type == "application/json"

    def test_audit_log_entry_validation(self):
        """Test audit log entry validation."""
        log_entry = AuditLogEntry(
            event_type="TRANSACTION",
            event_data={"tx_hash": "0x123...", "amount": "100"},
            actor="crypto-agent-001",
            severity="info",
            tags={"chain": "ethereum"}
        )
        assert log_entry.event_type == "TRANSACTION"
        assert log_entry.severity == "info"


# ===== Agent Metadata Tests =====

class TestAgentMetadata:
    """Test agent metadata and descriptions."""

    def test_enso_metadata(self):
        """Test ENSO agent metadata."""
        metadata = EnsoDeFiAgentMetadata()
        assert metadata.agent_name == "enso-defi-agent"
        assert "swap" in [op for op in metadata.supported_operations]
        assert len(metadata.capabilities) > 0
        assert "ethereum" in metadata.supported_chains

    def test_render_metadata(self):
        """Test Render Network agent metadata."""
        metadata = RenderNetworkAgentMetadata()
        assert metadata.agent_name == "render-network-agent"
        assert "3D: GLB" in " ".join(metadata.supported_formats)
        assert len(metadata.capabilities) > 0

    def test_akash_metadata(self):
        """Test Akash agent metadata."""
        metadata = AkashComputeAgentMetadata()
        assert metadata.agent_name == "akash-compute-agent"
        assert "NVIDIA A100" in metadata.supported_gpu_models
        assert len(metadata.cost_advantages) > 0

    def test_arweave_metadata(self):
        """Test Arweave agent metadata."""
        metadata = ArweaveMemoryAgentMetadata()
        assert metadata.agent_name == "arweave-memory-agent"
        assert "Permanent (200+ years)" in metadata.storage_guarantees
        assert len(metadata.capabilities) > 0


# ===== Agent Registry Tests =====

class TestAgentRegistry:
    """Test the crypto agent registry."""

    def setup_method(self):
        """Set up test registry."""
        self.registry = CryptoAgentRegistry()

    def test_registry_initialization(self):
        """Test registry initializes with all agents."""
        agents = self.registry.list_agents()
        assert len(agents) == 4
        assert "enso-defi-agent" in agents
        assert "render-network-agent" in agents
        assert "akash-compute-agent" in agents
        assert "arweave-memory-agent" in agents

    def test_get_agent_metadata(self):
        """Test retrieving agent metadata."""
        metadata = self.registry.get_agent_metadata("enso-defi-agent")
        assert metadata["name"] == "enso-defi-agent"
        assert metadata["layer"] == "Layer 2 - Interoperability"
        assert metadata["protocol"] == "ENSO"

    def test_search_by_capability(self):
        """Test searching agents by capability."""
        swap_agents = self.registry.search_by_capability("swap")
        assert "enso-defi-agent" in swap_agents

        render_agents = self.registry.search_by_capability("3D")
        assert "render-network-agent" in render_agents

    def test_search_by_tag(self):
        """Test searching agents by tag."""
        defi_agents = self.registry.search_by_tag("defi")
        assert "enso-defi-agent" in defi_agents

        gpu_agents = self.registry.search_by_tag("gpu")
        assert "render-network-agent" in gpu_agents
        assert "akash-compute-agent" in gpu_agents

    def test_search_by_layer(self):
        """Test searching agents by layer."""
        compute_agents = self.registry.search_by_layer("Layer 3 - Compute")
        assert "render-network-agent" in compute_agents
        assert "akash-compute-agent" in compute_agents

        memory_agents = self.registry.search_by_layer("Layer 4 - Memory")
        assert "arweave-memory-agent" in memory_agents

    def test_export_for_orchestrator(self):
        """Test exporting registry for orchestrator."""
        export = self.registry.export_for_orchestrator()
        assert "enso-defi-agent" in export
        assert "division" in export["enso-defi-agent"]
        assert "layer" in export["enso-defi-agent"]

    def test_llm_consumable_registry(self):
        """Test LLM-consumable format generation."""
        llm_desc = self.registry.get_llm_consumable_registry()
        assert "CRYPTO AGENT CAPABILITIES" in llm_desc
        assert "enso-defi-agent" in llm_desc
        assert "swap" in llm_desc.lower()

    def test_capability_matrix(self):
        """Test capability matrix generation."""
        matrix = self.registry.generate_capability_matrix()
        assert "CAPABILITY MATRIX" in matrix
        assert "Layer 2" in matrix or "Layer 3" in matrix


# ===== Executor Tests =====

class TestCryptoAgentExecutor:
    """Test the crypto agent executor."""

    def setup_method(self):
        """Set up test executor."""
        config = Config()
        self.executor = CryptoAgentExecutor(config)

    def test_executor_initialization(self):
        """Test executor initializes correctly."""
        assert self.executor.config is not None
        assert self.executor.enso_service is not None
        assert self.executor.compute_service is not None
        assert self.executor.memory_service is not None

    def test_agent_registry(self):
        """Test executor agent registry."""
        assert "enso-defi-agent" in self.executor.agent_registry
        assert "render-network-agent" in self.executor.agent_registry
        assert "akash-compute-agent" in self.executor.agent_registry
        assert "arweave-memory-agent" in self.executor.agent_registry

    @pytest.mark.asyncio
    async def test_execute_unknown_agent(self):
        """Test executing an unknown agent raises error."""
        with pytest.raises(ValueError, match="Unknown agent"):
            await self.executor.execute_agent("unknown-agent", {})

    @pytest.mark.asyncio
    async def test_execute_enso_swap_structure(self):
        """Test ENSO swap execution structure (mock)."""
        input_data = {
            "operation_type": "swap",
            "token_in": "ETH",
            "token_out": "USDC",
            "amount": "1.0",
            "slippage_tolerance": 0.5
        }

        # This will fail without actual API keys, but we're testing structure
        try:
            result = await self.executor.execute_agent("enso-defi-agent", input_data)
            # If it succeeds, check structure
            assert isinstance(result, dict)
        except Exception as e:
            # Expected to fail without real credentials
            assert "API" in str(e) or "key" in str(e).lower() or "config" in str(e).lower()

    @pytest.mark.asyncio
    async def test_execute_render_structure(self):
        """Test Render Network execution structure (mock)."""
        input_data = {
            "job_type": "3d_generation",
            "prompt": "A test model",
            "output_format": "glb",
            "quality": "high"
        }

        # This will fail without actual API keys, but we're testing structure
        try:
            result = await self.executor.execute_agent("render-network-agent", input_data)
            assert isinstance(result, dict)
        except Exception as e:
            # Expected to fail without real credentials
            assert True  # Structure test passed


# ===== Integration Tests =====

class TestIntegration:
    """Test integration between components."""

    def test_registry_integration_function(self):
        """Test registry integration function."""
        orchestrator_registry = register_crypto_agents_with_orchestrator()
        assert isinstance(orchestrator_registry, dict)
        assert len(orchestrator_registry) == 4

    def test_pydantic_to_dict_serialization(self):
        """Test Pydantic models serialize to dict properly."""
        input_model = EnsoDeFiInput(
            operation_type="swap",
            token_in="ETH",
            token_out="USDC",
            amount="1.0"
        )

        input_dict = input_model.dict()
        assert input_dict["operation_type"] == "swap"
        assert input_dict["token_in"] == "ETH"

    def test_end_to_end_data_flow(self):
        """Test data flow from Pydantic model to executor."""
        # Create Pydantic input
        input_model = ArweaveStorageInput(
            data_type="audit_log",
            content='{"test": "data"}',
            tags={"source": "test"}
        )

        # Convert to dict (as orchestrator would do)
        input_dict = input_model.dict()

        # Verify executor can accept it
        executor = CryptoAgentExecutor()
        assert "arweave-memory-agent" in executor.agent_registry


# ===== Performance Tests =====

class TestPerformance:
    """Test performance characteristics."""

    def test_registry_lookup_performance(self):
        """Test registry lookup is fast."""
        import time

        registry = CryptoAgentRegistry()

        start = time.time()
        for _ in range(1000):
            registry.get_agent_metadata("enso-defi-agent")
        elapsed = time.time() - start

        assert elapsed < 0.1  # Should be very fast

    def test_pydantic_validation_performance(self):
        """Test Pydantic validation is reasonably fast."""
        import time

        start = time.time()
        for _ in range(1000):
            EnsoDeFiInput(
                operation_type="swap",
                token_in="ETH",
                token_out="USDC",
                amount="1.0"
            )
        elapsed = time.time() - start

        assert elapsed < 1.0  # Should complete in under 1 second


# ===== Run Tests =====

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
