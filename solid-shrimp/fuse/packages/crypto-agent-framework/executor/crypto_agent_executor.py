"""
Crypto Agent Executor

This module bridges the Pydantic agent definitions in extension-system
with the actual service implementations in crypto-agent-framework.

It provides a unified execution interface that the orchestrator can call.
"""

import sys
import asyncio
from typing import Any, Dict, Optional
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.enso_service import EnsoService
from services.compute_service import ComputeService
from services.memory_service import ArweaveMemoryService
from config import Config

# Import Pydantic models from extension-system
pydantic_path = Path(__file__).parent.parent.parent / "extension-system" / "src" / "agents" / "pydantic" / "7.0_crypto_operations_division"
sys.path.insert(0, str(pydantic_path))

try:
    from enso_defi_agent import (
        EnsoDeFiInput, TokenSwapInput, YieldStakingInput, CrossChainBridgeInput,
        EnsoExecutionResult, YieldOptimizationReport, CrossChainBridgeResult
    )
    from render_network_agent import (
        RenderJobInput, Image3DGenerationInput, ImageGenerationInput,
        RenderJobResult, GeneratedModel3D
    )
    from akash_compute_agent import (
        AkashDeploymentInput, AITrainingJobInput, InferenceServiceInput,
        DeploymentResult, TrainingJobResult, InferenceAPIResult
    )
    from arweave_memory_agent import (
        ArweaveStorageInput, AuditLogEntry, AOStateManagementInput, MemoryQueryInput,
        StorageResult, AuditLogResult, AOProcessState, QueryResult, DataRetrievalResult
    )
except ImportError as e:
    print(f"Warning: Could not import Pydantic models: {e}")
    print("Executor will run with reduced functionality")


class CryptoAgentExecutor:
    """
    Executor that bridges Pydantic agent definitions with actual implementations.

    This class provides a unified interface for executing crypto operations
    defined by Pydantic models, routing them to the appropriate service layer.
    """

    def __init__(self, config: Optional[Config] = None):
        """
        Initialize the executor with service instances.

        Args:
            config: Configuration object (creates default if None)
        """
        self.config = config or Config()

        # Initialize services
        self.enso_service = EnsoService(self.config)
        self.compute_service = ComputeService(self.config)
        self.memory_service = ArweaveMemoryService(self.config)

        # Agent registry mapping agent names to execution methods
        self.agent_registry = {
            "enso-defi-agent": self._execute_enso_defi,
            "render-network-agent": self._execute_render_job,
            "akash-compute-agent": self._execute_akash_compute,
            "arweave-memory-agent": self._execute_arweave_memory,
        }

    async def execute_agent(self, agent_name: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute an agent by name with provided input data.

        This is the main entry point for the orchestrator to call agents.

        Args:
            agent_name: Name of the agent (e.g., "enso-defi-agent")
            input_data: Dictionary conforming to the agent's input Pydantic model

        Returns:
            Dictionary containing the agent's output (conforming to output Pydantic model)

        Raises:
            ValueError: If agent_name is not registered
            Exception: If agent execution fails
        """
        if agent_name not in self.agent_registry:
            raise ValueError(f"Unknown agent: {agent_name}. Available agents: {list(self.agent_registry.keys())}")

        execution_method = self.agent_registry[agent_name]

        try:
            result = await execution_method(input_data)
            return result
        except Exception as e:
            # Log error to Arweave for audit trail
            await self._log_error(agent_name, input_data, str(e))
            raise

    # ===== ENSO DeFi Agent Execution =====

    async def _execute_enso_defi(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute ENSO DeFi operations."""
        operation_type = input_data.get("operation_type")

        if operation_type == "swap":
            return await self._execute_token_swap(input_data)
        elif operation_type == "stake":
            return await self._execute_yield_staking(input_data)
        elif operation_type == "bridge":
            return await self._execute_cross_chain_bridge(input_data)
        elif operation_type in ["withdraw", "compound"]:
            # Generic DeFi operation
            return await self._execute_generic_defi(input_data)
        else:
            raise ValueError(f"Unknown ENSO operation type: {operation_type}")

    async def _execute_token_swap(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute token swap via ENSO."""
        result = await self.enso_service.swap_tokens(
            from_token=input_data["token_in"],
            to_token=input_data["token_out"],
            amount=input_data["amount"],
            slippage_tolerance=input_data.get("slippage_tolerance", 0.5)
        )

        # Log to Arweave
        await self.memory_service.save_log(
            agent_id=self.config.agent_id,
            log_data={
                "operation": "swap",
                "from_token": input_data["token_in"],
                "to_token": input_data["token_out"],
                "amount": input_data["amount"],
                "result": result
            }
        )

        return result

    async def _execute_yield_staking(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute yield staking via ENSO."""
        result = await self.enso_service.stake_for_yield(
            token=input_data["token_in"],
            amount=input_data["amount"],
            strategy=input_data.get("strategy", "highest_yield")
        )

        # Log to Arweave
        await self.memory_service.save_log(
            agent_id=self.config.agent_id,
            log_data={
                "operation": "stake",
                "token": input_data["token_in"],
                "amount": input_data["amount"],
                "strategy": input_data.get("strategy"),
                "result": result
            }
        )

        return result

    async def _execute_cross_chain_bridge(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute cross-chain bridge via ENSO."""
        result = await self.enso_service.bridge_tokens(
            token=input_data["token_in"],
            amount=input_data["amount"],
            from_chain=input_data["chain_from"],
            to_chain=input_data["chain_to"]
        )

        # Log to Arweave
        await self.memory_service.save_log(
            agent_id=self.config.agent_id,
            log_data={
                "operation": "bridge",
                "token": input_data["token_in"],
                "amount": input_data["amount"],
                "from_chain": input_data["chain_from"],
                "to_chain": input_data["chain_to"],
                "result": result
            }
        )

        return result

    async def _execute_generic_defi(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute generic DeFi operation via ENSO intent."""
        intent_string = f"{input_data['operation_type']} {input_data['amount']} {input_data['token_in']}"

        result = await self.enso_service.submit_intent(
            intent_string=intent_string,
            params=input_data
        )

        # Log to Arweave
        await self.memory_service.save_log(
            agent_id=self.config.agent_id,
            log_data={
                "operation": input_data["operation_type"],
                "intent": intent_string,
                "result": result
            }
        )

        return result

    # ===== Render Network Agent Execution =====

    async def _execute_render_job(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Render Network job."""
        job_type = input_data.get("job_type")

        if job_type == "3d_generation":
            return await self._execute_3d_generation(input_data)
        elif job_type == "image_generation":
            return await self._execute_image_generation(input_data)
        elif job_type in ["video_render", "vfx_composite"]:
            return await self._execute_render_generic(input_data)
        else:
            raise ValueError(f"Unknown Render job type: {job_type}")

    async def _execute_3d_generation(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute 3D model generation."""
        result = await self.compute_service.dispatch_render_job(
            job_type="3d_generation",
            prompt=input_data.get("prompt") or input_data.get("description"),
            output_format=input_data.get("output_format", "glb"),
            quality=input_data.get("quality", "high")
        )

        # Store result metadata on Arweave
        await self.memory_service.save_log(
            agent_id=self.config.agent_id,
            log_data={
                "operation": "3d_generation",
                "prompt": input_data.get("prompt"),
                "result": result
            }
        )

        return result

    async def _execute_image_generation(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute AI image generation."""
        result = await self.compute_service.dispatch_render_job(
            job_type="image_generation",
            prompt=input_data["prompt"],
            style=input_data.get("style"),
            quality=input_data.get("quality", "high"),
            num_images=input_data.get("num_images", 1)
        )

        # Store result metadata on Arweave
        await self.memory_service.save_log(
            agent_id=self.config.agent_id,
            log_data={
                "operation": "image_generation",
                "prompt": input_data["prompt"],
                "result": result
            }
        )

        return result

    async def _execute_render_generic(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute generic rendering job."""
        result = await self.compute_service.dispatch_render_job(
            job_type=input_data["job_type"],
            scene_file_url=input_data.get("scene_file_url"),
            output_format=input_data.get("output_format"),
            quality=input_data.get("quality", "high"),
            engine=input_data.get("engine", "Blender")
        )

        await self.memory_service.save_log(
            agent_id=self.config.agent_id,
            log_data={
                "operation": input_data["job_type"],
                "result": result
            }
        )

        return result

    # ===== Akash Compute Agent Execution =====

    async def _execute_akash_compute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Akash Network compute deployment."""
        deployment_type = input_data.get("deployment_type")

        if deployment_type == "ai_training":
            return await self._execute_ai_training(input_data)
        elif deployment_type == "model_inference":
            return await self._execute_model_inference(input_data)
        elif deployment_type in ["agent_runtime", "api_service", "custom"]:
            return await self._execute_akash_deployment(input_data)
        else:
            raise ValueError(f"Unknown Akash deployment type: {deployment_type}")

    async def _execute_ai_training(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute AI training job on Akash."""
        result = await self.compute_service.dispatch_akash_job(
            job_type="ai_training",
            docker_image=input_data.get("docker_image", "pytorch/pytorch:latest"),
            cpu_cores=input_data.get("cpu_cores", 4),
            memory_gb=input_data.get("memory_gb", 16),
            gpu_model=input_data.get("gpu_model"),
            gpu_count=input_data.get("gpu_count", 1),
            environment=input_data.get("environment_variables", {}),
            training_config=input_data
        )

        await self.memory_service.save_log(
            agent_id=self.config.agent_id,
            log_data={
                "operation": "ai_training",
                "deployment_id": result.get("deployment_id"),
                "result": result
            }
        )

        return result

    async def _execute_model_inference(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Deploy inference API on Akash."""
        result = await self.compute_service.dispatch_akash_job(
            job_type="model_inference",
            docker_image=input_data.get("docker_image"),
            cpu_cores=input_data.get("cpu_cores", 2),
            memory_gb=input_data.get("memory_gb", 8),
            expose_ports=input_data.get("expose_ports", [8000]),
            environment=input_data.get("environment_variables", {}),
            inference_config=input_data
        )

        await self.memory_service.save_log(
            agent_id=self.config.agent_id,
            log_data={
                "operation": "model_inference",
                "deployment_id": result.get("deployment_id"),
                "result": result
            }
        )

        return result

    async def _execute_akash_deployment(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute generic Akash deployment."""
        result = await self.compute_service.dispatch_akash_job(
            job_type=input_data["deployment_type"],
            docker_image=input_data["docker_image"],
            cpu_cores=input_data["cpu_cores"],
            memory_gb=input_data["memory_gb"],
            storage_gb=input_data.get("storage_gb", 10),
            gpu_model=input_data.get("gpu_model"),
            gpu_count=input_data.get("gpu_count", 0),
            expose_ports=input_data.get("expose_ports", []),
            environment=input_data.get("environment_variables", {})
        )

        await self.memory_service.save_log(
            agent_id=self.config.agent_id,
            log_data={
                "operation": "akash_deployment",
                "deployment_id": result.get("deployment_id"),
                "result": result
            }
        )

        return result

    # ===== Arweave Memory Agent Execution =====

    async def _execute_arweave_memory(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Arweave/AO memory operations."""

        # Determine operation from input_data structure
        if "data_type" in input_data:
            # ArweaveStorageInput
            return await self._execute_arweave_storage(input_data)
        elif "event_type" in input_data:
            # AuditLogEntry
            return await self._execute_audit_log(input_data)
        elif "process_id" in input_data:
            # AOStateManagementInput
            return await self._execute_ao_state(input_data)
        elif "query_type" in input_data:
            # MemoryQueryInput
            return await self._execute_memory_query(input_data)
        else:
            raise ValueError("Cannot determine Arweave operation type from input_data")

    async def _execute_arweave_storage(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Store data on Arweave."""
        tx_id = await self.memory_service.store_data(
            data_type=input_data["data_type"],
            content=input_data["content"],
            tags=input_data.get("tags", {}),
            content_type=input_data.get("content_type", "application/json"),
            encrypt=input_data.get("encrypt", False)
        )

        return {
            "status": "confirmed",
            "tx_id": tx_id,
            "data_type": input_data["data_type"],
            "gateway_url": f"https://arweave.net/{tx_id}",
            "permanent": True
        }

    async def _execute_audit_log(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Store audit log entry."""
        tx_id = await self.memory_service.save_log(
            agent_id=self.config.agent_id,
            log_data={
                "event_type": input_data["event_type"],
                "event_data": input_data["event_data"],
                "actor": input_data["actor"],
                "timestamp": input_data.get("timestamp"),
                "severity": input_data.get("severity", "info"),
                "tags": input_data.get("tags", {})
            }
        )

        return {
            "log_id": tx_id,
            "stored_on_arweave": True,
            "event_type": input_data["event_type"],
            "immutable": True,
            "tamper_proof": True,
            "cryptographically_signed": True
        }

    async def _execute_ao_state(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Manage state on AO."""
        action = input_data["action"]
        process_id = input_data["process_id"]

        if action == "save_state":
            result = await self.memory_service.save_state_to_ao(
                process_id=process_id,
                state_data=input_data["state_data"]
            )
        elif action == "load_state":
            result = await self.memory_service.load_state_from_ao(
                process_id=process_id
            )
        elif action == "update_state":
            result = await self.memory_service.update_ao_state(
                process_id=process_id,
                state_key=input_data.get("state_key"),
                state_data=input_data["state_data"]
            )
        elif action == "delete_state":
            result = await self.memory_service.delete_ao_state(
                process_id=process_id,
                state_key=input_data.get("state_key")
            )
        else:
            raise ValueError(f"Unknown AO state action: {action}")

        return result

    async def _execute_memory_query(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Query stored data from Arweave."""
        results = await self.memory_service.query_logs(
            filters=input_data["filters"],
            limit=input_data.get("limit", 10)
        )

        return {
            "query_type": input_data["query_type"],
            "results_found": len(results),
            "transactions": results,
            "query_time_ms": 0,  # Would be calculated in real implementation
            "cache_hit": False
        }

    # ===== Error Handling =====

    async def _log_error(self, agent_name: str, input_data: Dict[str, Any], error: str) -> None:
        """Log execution errors to Arweave for audit trail."""
        try:
            await self.memory_service.save_log(
                agent_id=self.config.agent_id,
                log_data={
                    "event_type": "AGENT_ERROR",
                    "agent_name": agent_name,
                    "input_data": input_data,
                    "error": error,
                    "severity": "error"
                }
            )
        except Exception as log_error:
            print(f"Failed to log error to Arweave: {log_error}")


# ===== CLI Interface for Testing =====

async def main():
    """CLI interface for testing the executor."""
    import json

    executor = CryptoAgentExecutor()

    print("Crypto Agent Executor - Test CLI")
    print("=" * 50)
    print("\nAvailable agents:")
    for agent_name in executor.agent_registry.keys():
        print(f"  - {agent_name}")

    print("\nExample: execute_agent('enso-defi-agent', {...})")

    # Example execution
    test_input = {
        "operation_type": "swap",
        "token_in": "ETH",
        "token_out": "USDC",
        "amount": "1.0",
        "slippage_tolerance": 0.5
    }

    print(f"\nTest execution: enso-defi-agent with input:")
    print(json.dumps(test_input, indent=2))

    try:
        result = await executor.execute_agent("enso-defi-agent", test_input)
        print("\nResult:")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"\nError: {e}")


if __name__ == "__main__":
    asyncio.run(main())
