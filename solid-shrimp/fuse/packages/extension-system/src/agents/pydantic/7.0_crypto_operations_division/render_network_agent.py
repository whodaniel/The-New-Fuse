"""
Render Network Agent

This agent handles 3D rendering, VFX, and generative AI inference using the
Render Network's decentralized GPU infrastructure.

Division: 7.0 Crypto Operations
Protocol: Render Network (Layer 3 - Compute)
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict, Optional, Literal
from datetime import datetime

# ===== Input Models =====

class RenderJobInput(BaseModel):
    """
    Input parameters for submitting a rendering or generation job to Render Network.
    """
    job_type: Literal["3d_generation", "image_generation", "video_render", "vfx_composite"] = Field(
        ...,
        description="Type of rendering/generation job"
    )
    prompt: Optional[str] = Field(None, description="AI generation prompt (for generative tasks)")
    scene_file_url: Optional[HttpUrl] = Field(None, description="URL to 3D scene file (for rendering tasks)")
    engine: Literal["StabilityAI", "Blender", "Houdini", "Unreal", "Custom"] = Field(
        "StabilityAI",
        description="Rendering/generation engine to use"
    )
    output_format: Literal["png", "jpg", "glb", "gltf", "fbx", "mp4", "exr"] = Field(
        ...,
        description="Desired output format"
    )
    resolution: str = Field("1024x1024", description="Output resolution (e.g., '1920x1080', '2048x2048')")
    quality: Literal["draft", "medium", "high", "production"] = Field("high", description="Quality preset")
    samples: int = Field(50, ge=1, le=1000, description="Sampling/quality iterations")
    priority: Literal["low", "normal", "high", "urgent"] = Field("normal", description="Job priority level")


class Image3DGenerationInput(BaseModel):
    """
    Simplified input for AI-powered 3D model generation.
    """
    description: str = Field(..., description="Text description of the 3D model to generate")
    style: Optional[Literal["realistic", "stylized", "low_poly", "photorealistic"]] = Field(
        "realistic",
        description="Visual style"
    )
    output_format: Literal["glb", "gltf", "fbx", "obj"] = Field("glb", description="3D file format")
    include_textures: bool = Field(True, description="Whether to include PBR textures")
    polycount_target: Optional[Literal["low", "medium", "high"]] = Field(
        "medium",
        description="Target polygon count"
    )


class ImageGenerationInput(BaseModel):
    """
    Input for AI image generation.
    """
    prompt: str = Field(..., min_length=3, description="Image generation prompt")
    negative_prompt: Optional[str] = Field(None, description="Elements to avoid in generation")
    style: Optional[str] = Field(None, description="Artistic style")
    aspect_ratio: Literal["1:1", "16:9", "4:3", "3:2", "9:16"] = Field("1:1", description="Image aspect ratio")
    quality: Literal["draft", "standard", "high", "ultra"] = Field("high", description="Generation quality")
    num_images: int = Field(1, ge=1, le=10, description="Number of variations to generate")


# ===== Output Models =====

class RenderAsset(BaseModel):
    """
    Details about a rendered/generated asset.
    """
    asset_id: str = Field(..., description="Unique asset identifier")
    asset_url: HttpUrl = Field(..., description="URL to download the asset")
    asset_type: str = Field(..., description="Asset type/format")
    file_size_mb: float = Field(..., description="File size in megabytes")
    resolution: str = Field(..., description="Asset resolution")
    metadata: Dict[str, str] = Field(default_factory=dict, description="Additional asset metadata")
    thumbnail_url: Optional[HttpUrl] = Field(None, description="Preview thumbnail URL")
    ipfs_hash: Optional[str] = Field(None, description="IPFS hash if stored on IPFS")


class RenderJobResult(BaseModel):
    """
    Result of a completed render job.
    """
    job_id: str = Field(..., description="Render job identifier")
    status: Literal["completed", "failed", "cancelled"] = Field(..., description="Job status")

    # Output assets
    primary_asset: RenderAsset = Field(..., description="Main output asset")
    additional_assets: List[RenderAsset] = Field(default_factory=list, description="Additional outputs (variations, etc.)")

    # Render details
    engine_used: str = Field(..., description="Rendering engine that processed the job")
    render_time_seconds: float = Field(..., description="Total render time")
    gpu_used: str = Field(..., description="GPU hardware used for rendering")
    render_nodes: int = Field(..., description="Number of distributed nodes used")

    # Cost breakdown
    compute_cost_rndr: str = Field(..., description="Cost in RNDR tokens")
    compute_cost_usd: str = Field(..., description="Cost in USD equivalent")
    cost_per_second: str = Field(..., description="Cost per second of render time")

    # Quality metrics
    quality_score: Optional[float] = Field(None, ge=0.0, le=10.0, description="Automated quality assessment")
    artifacts_detected: List[str] = Field(default_factory=list, description="Visual artifacts detected")

    # Timestamps
    submitted_at: datetime = Field(..., description="Job submission time")
    started_at: datetime = Field(..., description="Render start time")
    completed_at: datetime = Field(..., description="Render completion time")

    # Error handling
    error_message: Optional[str] = Field(None, description="Error details if job failed")
    partial_results: List[RenderAsset] = Field(default_factory=list, description="Partial results if job was cancelled")


class GeneratedModel3D(BaseModel):
    """
    Result of AI-powered 3D model generation.
    """
    model_id: str = Field(..., description="Unique model identifier")
    description: str = Field(..., description="Original generation prompt")

    # Model files
    model_url: HttpUrl = Field(..., description="URL to download 3D model")
    model_format: str = Field(..., description="3D file format")
    texture_urls: List[HttpUrl] = Field(default_factory=list, description="PBR texture map URLs")

    # Model properties
    polygon_count: int = Field(..., description="Total polygon count")
    vertex_count: int = Field(..., description="Total vertex count")
    has_animations: bool = Field(False, description="Whether model includes animations")
    has_rigging: bool = Field(False, description="Whether model is rigged")

    # Previews
    preview_images: List[HttpUrl] = Field(..., description="Preview render URLs")
    turntable_video: Optional[HttpUrl] = Field(None, description="360° turntable video URL")

    # Metadata
    bounding_box: Dict[str, float] = Field(..., description="Model bounding box dimensions")
    file_size_mb: float = Field(..., description="Total file size including textures")
    generation_time_seconds: float = Field(..., description="Time taken to generate")
    cost_usd: str = Field(..., description="Generation cost in USD")


class GPUResourceUsage(BaseModel):
    """
    Details about GPU compute resource usage.
    """
    gpu_model: str = Field(..., description="GPU hardware model used")
    gpu_memory_used_gb: float = Field(..., description="VRAM used in GB")
    compute_time_seconds: float = Field(..., description="Active GPU compute time")
    power_usage_kwh: float = Field(..., description="Estimated power consumption")
    carbon_offset_kg: Optional[float] = Field(None, description="Carbon offset purchased (if applicable)")


# ===== Agent Metadata =====

class RenderNetworkAgentMetadata(BaseModel):
    """
    Metadata describing the Render Network Agent's capabilities.
    """
    agent_name: str = "render-network-agent"
    version: str = "1.0.0"
    description: str = Field(
        default="Executes 3D rendering, VFX, and generative AI tasks using Render Network's "
        "decentralized GPU infrastructure. Specializes in high-quality 3D model generation, "
        "image synthesis, video rendering, and complex visual effects processing."
    )

    capabilities: List[str] = Field(default=[
        "AI-powered 3D model generation",
        "Text-to-image generation",
        "3D scene rendering (Blender, Houdini, Unreal)",
        "VFX compositing",
        "Video rendering",
        "PBR texture generation",
        "Turntable/product visualization",
        "Distributed GPU compute"
    ])

    supported_engines: List[str] = Field(default=[
        "StabilityAI",
        "Blender",
        "Houdini",
        "Unreal Engine",
        "Custom engines"
    ])

    supported_formats: List[str] = Field(default=[
        "3D: GLB, GLTF, FBX, OBJ, USD",
        "Image: PNG, JPG, EXR, TIFF",
        "Video: MP4, MOV, WebM"
    ])

    input_models: List[str] = Field(default=[
        "RenderJobInput",
        "Image3DGenerationInput",
        "ImageGenerationInput"
    ])

    output_models: List[str] = Field(default=[
        "RenderJobResult",
        "GeneratedModel3D",
        "GPUResourceUsage"
    ])

    typical_use_cases: List[str] = Field(default=[
        "Generate 3D models for NFTs",
        "Create product visualizations",
        "Render architectural visualizations",
        "Generate game assets",
        "Create marketing materials",
        "Process VFX for video content"
    ])

    llm_consumable_description: str = Field(
        default="I can generate 3D models, images, and videos using AI and traditional rendering engines on "
        "Render Network's decentralized GPU infrastructure. Tell me what you want to create (e.g., "
        "'Generate a 3D model of a futuristic car', 'Create a photorealistic image of a sunset over mountains', "
        "'Render a Blender scene') and I'll handle the GPU compute, file management, and delivery. "
        "Perfect for NFT creation, game assets, product visualization, and creative content."
    )
