"""
Layer 3: Compute Service (Akash & Render)
Dispatches and manages heavy off-chain computation jobs
on decentralized GPU networks.
"""
import json
import hashlib
from typing import Dict, Optional, Any
from enum import Enum

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import config
from ..utils.logger import get_logger

logger = get_logger(__name__)


class ComputeProvider(str, Enum):
    """Supported decentralized compute providers"""
    AKASH = "akash"
    RENDER = "render"


class JobStatus(str, Enum):
    """Job execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ComputeService:
    """
    Dispatches and manages heavy off-chain computation jobs
    on decentralized GPU networks.

    Providers:
    - Akash Network: General-purpose compute, AI training, backends
    - Render Network: 3D/VFX rendering, Generative AI inference
    """

    def __init__(self):
        self.akash_api_url = config.AKASH_API_URL
        self.akash_api_key = config.AKASH_API_KEY
        self.render_api_url = config.RENDER_API_URL
        self.render_api_key = config.RENDER_API_KEY

        logger.info(
            "Compute Service Initialized (L3 Work - Akash & Render)",
            akash_enabled=bool(self.akash_api_key),
            render_enabled=bool(self.render_api_key)
        )

    # ===== Akash Network Methods =====

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def dispatch_akash_job(self, job_spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deploys a general-purpose compute job to Akash Network.
        Ideal for AI training, backends, and sovereign agents.

        Args:
            job_spec: Job specification dictionary containing:
                - image: Docker image to deploy
                - gpus: GPU requirements (e.g., "1x NVIDIA A100")
                - memory: Memory requirements
                - cpu: CPU requirements
                - env: Environment variables
                - command: Optional command to run

        Returns:
            Dictionary with job status and results

        Example:
            >>> result = await compute.dispatch_akash_job({
            ...     "image": "my-training-container:latest",
            ...     "gpus": "1x NVIDIA B200",
            ...     "memory": "32GB",
            ...     "cpu": "8",
            ...     "env": {"MODEL_TYPE": "llama-2"}
            ... })
        """
        logger.info(
            "[AKASH] Deploying general compute job",
            image=job_spec.get("image"),
            gpus=job_spec.get("gpus")
        )

        if not self.akash_api_key:
            logger.warning("[AKASH] API key not configured, using mock mode")
            return self._mock_akash_job(job_spec)

        try:
            # Build Akash SDL (Stack Definition Language) manifest
            sdl_manifest = self._build_akash_sdl(job_spec)

            async with httpx.AsyncClient(timeout=60.0) as client:
                # Create deployment
                response = await client.post(
                    f"{self.akash_api_url}/deployments",
                    headers={
                        "Authorization": f"Bearer {self.akash_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "sdl": sdl_manifest,
                        "deposit": "5000000uakt"  # 5 AKT deposit
                    }
                )

                if response.status_code in [200, 201]:
                    result = response.json()
                    deployment_id = result.get("id")

                    logger.info(
                        "[AKASH] Deployment created",
                        deployment_id=deployment_id
                    )

                    # Wait for deployment to complete
                    job_result = await self._wait_for_akash_job(deployment_id)
                    return job_result
                else:
                    logger.error(
                        "[AKASH] Deployment failed",
                        status=response.status_code,
                        error=response.text
                    )
                    return {
                        "status": JobStatus.FAILED,
                        "error": f"Deployment failed: {response.text}"
                    }

        except Exception as e:
            logger.error(f"[AKASH] Error dispatching job: {e}")
            return {
                "status": JobStatus.FAILED,
                "error": str(e)
            }

    def _build_akash_sdl(self, job_spec: Dict[str, Any]) -> Dict:
        """Build Akash Stack Definition Language manifest"""
        return {
            "version": "2.0",
            "services": {
                "app": {
                    "image": job_spec.get("image"),
                    "env": job_spec.get("env", {}),
                    "resources": {
                        "cpu": {
                            "units": job_spec.get("cpu", "2")
                        },
                        "memory": {
                            "size": job_spec.get("memory", "4Gi")
                        },
                        "storage": {
                            "size": job_spec.get("storage", "10Gi")
                        },
                        "gpu": {
                            "units": job_spec.get("gpus", "0")
                        }
                    }
                }
            },
            "profiles": {
                "compute": {
                    "app": {
                        "resources": {
                            "cpu": {"units": job_spec.get("cpu", "2")},
                            "memory": {"size": job_spec.get("memory", "4Gi")},
                            "storage": {"size": job_spec.get("storage", "10Gi")}
                        }
                    }
                },
                "placement": {
                    "dcloud": {
                        "pricing": {
                            "app": {
                                "denom": "uakt",
                                "amount": 100
                            }
                        }
                    }
                }
            },
            "deployment": {
                "app": {
                    "dcloud": {
                        "profile": "app",
                        "count": 1
                    }
                }
            }
        }

    async def _wait_for_akash_job(self, deployment_id: str) -> Dict[str, Any]:
        """Poll Akash deployment status until completion"""
        import asyncio

        max_wait = 600  # 10 minutes
        poll_interval = 10
        elapsed = 0

        while elapsed < max_wait:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{self.akash_api_url}/deployments/{deployment_id}/status",
                        headers={"Authorization": f"Bearer {self.akash_api_key}"}
                    )

                    if response.status_code == 200:
                        status_data = response.json()
                        state = status_data.get("state")

                        if state == "active":
                            logger.info(f"[AKASH] Job completed: {deployment_id}")
                            return {
                                "status": JobStatus.COMPLETED,
                                "deployment_id": deployment_id,
                                "result_data": status_data.get("logs", "Job completed successfully")
                            }
                        elif state == "failed":
                            return {
                                "status": JobStatus.FAILED,
                                "error": status_data.get("error", "Unknown error")
                            }

            except Exception as e:
                logger.warning(f"[AKASH] Error polling status: {e}")

            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

        return {
            "status": JobStatus.FAILED,
            "error": "Job timeout"
        }

    def _mock_akash_job(self, job_spec: Dict) -> Dict[str, Any]:
        """Mock Akash job for testing"""
        job_id = f"akash_{hashlib.sha256(str(job_spec).encode()).hexdigest()[:16]}"
        logger.debug(f"[AKASH:MOCK] Job dispatched: {job_id}")
        return {
            "status": JobStatus.COMPLETED,
            "job_id": job_id,
            "result_data": "trained_model_weights.h5",
            "mock": True
        }

    # ===== Render Network Methods =====

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def dispatch_render_job(self, job_spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dispatches a specialized GPU job to Render Network.
        Ideal for 3D/VFX rendering and Generative AI inference.

        Args:
            job_spec: Job specification dictionary containing:
                - engine: Render engine (e.g., 'StabilityAI', 'Blender')
                - prompt: Generation prompt (for AI models)
                - format: Output format (e.g., 'glb', 'png', 'mp4')
                - resolution: Output resolution
                - samples: Quality/samples count
                - scene_file: Scene file URL (for 3D rendering)

        Returns:
            Dictionary with job status and asset URL

        Example:
            >>> result = await compute.dispatch_render_job({
            ...     "engine": "StabilityAI",
            ...     "prompt": "red sports car, 3D model",
            ...     "format": "glb"
            ... })
        """
        logger.info(
            "[RENDER] Dispatching GenAI inference job",
            engine=job_spec.get("engine"),
            prompt=job_spec.get("prompt", "")[:50]
        )

        if not self.render_api_key:
            logger.warning("[RENDER] API key not configured, using mock mode")
            return self._mock_render_job(job_spec)

        try:
            # Build Render job specification
            render_payload = {
                "engine": job_spec.get("engine", "StabilityAI"),
                "parameters": {
                    "prompt": job_spec.get("prompt", ""),
                    "format": job_spec.get("format", "png"),
                    "resolution": job_spec.get("resolution", "1024x1024"),
                    "samples": job_spec.get("samples", 50),
                },
                "priority": job_spec.get("priority", "normal")
            }

            async with httpx.AsyncClient(timeout=120.0) as client:
                # Submit job to Render Network
                response = await client.post(
                    f"{self.render_api_url}/jobs",
                    headers={
                        "Authorization": f"Bearer {self.render_api_key}",
                        "Content-Type": "application/json"
                    },
                    json=render_payload
                )

                if response.status_code in [200, 201]:
                    result = response.json()
                    job_id = result.get("job_id")

                    logger.info(
                        "[RENDER] Job submitted",
                        job_id=job_id
                    )

                    # Wait for rendering to complete
                    job_result = await self._wait_for_render_job(job_id)
                    return job_result
                else:
                    logger.error(
                        "[RENDER] Job submission failed",
                        status=response.status_code,
                        error=response.text
                    )
                    return {
                        "status": JobStatus.FAILED,
                        "error": f"Submission failed: {response.text}"
                    }

        except Exception as e:
            logger.error(f"[RENDER] Error dispatching job: {e}")
            return {
                "status": JobStatus.FAILED,
                "error": str(e)
            }

    async def _wait_for_render_job(self, job_id: str) -> Dict[str, Any]:
        """Poll Render job status until completion"""
        import asyncio

        max_wait = 900  # 15 minutes for rendering
        poll_interval = 15
        elapsed = 0

        while elapsed < max_wait:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{self.render_api_url}/jobs/{job_id}",
                        headers={"Authorization": f"Bearer {self.render_api_key}"}
                    )

                    if response.status_code == 200:
                        status_data = response.json()
                        status = status_data.get("status")

                        if status == "completed":
                            asset_url = status_data.get("output_url")
                            logger.info(
                                "[RENDER] Job completed",
                                job_id=job_id,
                                asset_url=asset_url
                            )
                            return {
                                "status": JobStatus.COMPLETED,
                                "job_id": job_id,
                                "asset_url": asset_url,
                                "metadata": status_data.get("metadata", {})
                            }
                        elif status == "failed":
                            return {
                                "status": JobStatus.FAILED,
                                "error": status_data.get("error", "Rendering failed")
                            }

            except Exception as e:
                logger.warning(f"[RENDER] Error polling status: {e}")

            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

        return {
            "status": JobStatus.FAILED,
            "error": "Rendering timeout"
        }

    def _mock_render_job(self, job_spec: Dict) -> Dict[str, Any]:
        """Mock Render job for testing"""
        job_id = f"render_{hashlib.sha256(str(job_spec).encode()).hexdigest()[:16]}"
        mock_url = f"https://render.mock/assets/{job_id}.{job_spec.get('format', 'glb')}"

        logger.debug(f"[RENDER:MOCK] Job dispatched: {job_id}")
        return {
            "status": JobStatus.COMPLETED,
            "job_id": job_id,
            "asset_url": mock_url,
            "mock": True
        }

    # ===== Utility Methods =====

    async def get_job_status(
        self,
        provider: ComputeProvider,
        job_id: str
    ) -> Dict[str, Any]:
        """
        Get the status of a job from any provider.

        Args:
            provider: Compute provider (akash or render)
            job_id: Job identifier

        Returns:
            Job status dictionary
        """
        if provider == ComputeProvider.AKASH:
            return await self._wait_for_akash_job(job_id)
        elif provider == ComputeProvider.RENDER:
            return await self._wait_for_render_job(job_id)
        else:
            return {"status": JobStatus.FAILED, "error": "Unknown provider"}

    async def cancel_job(
        self,
        provider: ComputeProvider,
        job_id: str
    ) -> bool:
        """
        Cancel a running job.

        Args:
            provider: Compute provider
            job_id: Job identifier

        Returns:
            True if cancelled successfully
        """
        logger.info(f"[{provider.value.upper()}] Cancelling job {job_id}")

        try:
            api_url = self.akash_api_url if provider == ComputeProvider.AKASH else self.render_api_url
            api_key = self.akash_api_key if provider == ComputeProvider.AKASH else self.render_api_key

            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{api_url}/jobs/{job_id}",
                    headers={"Authorization": f"Bearer {api_key}"}
                )

                return response.status_code in [200, 204]

        except Exception as e:
            logger.error(f"[{provider.value.upper()}] Error cancelling job: {e}")
            return False
