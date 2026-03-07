# Video Diffusion Model Integration Design Document

**Created:** January 12, 2026  
**Status:** Research & Design Phase  
**Author:** Antigravity AI

## Executive Summary

This document outlines how to integrate video diffusion models (Veo, Runway ML,
Sora, Pika, etc.) into The New Fuse platform to provide AI-generated video
capabilities to both **AI Agents** and **Human Users**.

---

## 1. Current Platform Architecture

Based on codebase analysis, The New Fuse has these relevant components:

### Core Systems

| Component            | Location                     | Purpose                                             |
| -------------------- | ---------------------------- | --------------------------------------------------- |
| **Agent System**     | `packages/agent/`            | Multi-model LLM agents with tool integration        |
| **MCP Core**         | `packages/mcp-core/`         | Model Context Protocol for tool/service integration |
| **Workflow Engine**  | `packages/workflow-engine/`  | Task orchestration and execution                    |
| **Extension System** | `packages/extension-system/` | Plugin/module architecture                          |
| **n8n Workflows**    | `packages/n8n-workflows/`    | External service integration patterns               |

### Existing Patterns

- **Tool Interface** (`IMCPTool.ts`): Standardized tool definition with
  input/output schemas
- **Agent Providers**: Support for OpenAI, Anthropic, Google, and local
  providers
- **Workflow Tasks**: Task-based execution with priority, status, and agent
  assignment
- **Extension Types**: MODULE, PLUGIN, INTEGRATION with lifecycle management

---

## 2. Video Diffusion Model Landscape

### Available APIs & Services

| Provider         | Model         | API Type          | Capabilities                                  | Pricing Model         |
| ---------------- | ------------- | ----------------- | --------------------------------------------- | --------------------- |
| **Google Veo 2** | Veo           | REST API (Gemini) | Text-to-video, Image-to-video                 | Token/request         |
| **Runway ML**    | Gen-3 Alpha   | REST API          | Text-to-video, Image-to-video, Video-to-video | Credits               |
| **OpenAI Sora**  | Sora          | API (beta)        | Text-to-video, Image-to-video                 | Token-based           |
| **Pika Labs**    | Pika 1.0      | API               | Text-to-video, style transfer                 | Credits               |
| **Stability AI** | SVD           | API / Self-hosted | Image-to-video                                | Credits / Self-hosted |
| **Luma AI**      | Dream Machine | REST API          | Text-to-video                                 | Credits               |
| **Replicate**    | Multiple      | Unified API       | Hosts multiple models                         | Per-prediction        |

---

## 3. Integration Architecture

### 3.1 Recommended Approach: MCP Tool Provider

Create video generation as an **MCP Tool** that can be used by any agent in the
system.

```typescript
// packages/mcp-core/src/tools/video-generation/VideoGenerationTool.ts

import {
  MCPTool,
  ToolHandler,
  ToolResult,
  JSONSchema,
} from '../interfaces/IMCPTool';

export interface VideoGenerationParams {
  prompt: string;
  provider: 'veo' | 'runway' | 'sora' | 'pika' | 'luma' | 'replicate';
  model?: string;

  // Input options
  inputType: 'text' | 'image' | 'video';
  inputImageUrl?: string;
  inputVideoUrl?: string;

  // Output options
  duration?: number; // seconds (typically 4-16)
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  resolution?: '720p' | '1080p' | '4k';
  fps?: 24 | 30 | 60;

  // Style options
  style?: string;
  negativePrompt?: string;
  seed?: number;

  // Generation options
  numVideos?: number;
  guidanceScale?: number;
}

export interface VideoGenerationResult {
  success: boolean;
  videos: GeneratedVideo[];
  metadata: VideoGenerationMetadata;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
}

export interface VideoGenerationMetadata {
  provider: string;
  model: string;
  generationTimeMs: number;
  cost?: {
    credits?: number;
    tokens?: number;
    usd?: number;
  };
  promptUsed: string;
  seed?: number;
}
```

### 3.2 Provider Abstraction Layer

```typescript
// packages/mcp-core/src/tools/video-generation/providers/IVideoProvider.ts

export interface IVideoProvider {
  name: string;
  supportedModels: string[];
  supportedInputTypes: ('text' | 'image' | 'video')[];

  // Core methods
  generateVideo(params: VideoGenerationParams): Promise<VideoGenerationJob>;
  getJobStatus(jobId: string): Promise<JobStatus>;
  cancelJob(jobId: string): Promise<void>;

  // Capabilities
  getCapabilities(): VideoProviderCapabilities;
  estimateCost(params: VideoGenerationParams): Promise<CostEstimate>;

  // Authentication
  validateCredentials(): Promise<boolean>;
}

export interface VideoGenerationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  result?: VideoGenerationResult;
  error?: string;
}
```

### 3.3 Individual Provider Implementations

```typescript
// packages/mcp-core/src/tools/video-generation/providers/VeoProvider.ts

import { IVideoProvider, VideoGenerationParams } from './IVideoProvider';

export class VeoProvider implements IVideoProvider {
  name = 'veo';
  supportedModels = ['veo-2', 'veo-1'];
  supportedInputTypes: ('text' | 'image')[] = ['text', 'image'];

  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateVideo(
    params: VideoGenerationParams
  ): Promise<VideoGenerationJob> {
    const response = await fetch(`${this.baseUrl}/models/veo-2:generateVideo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        prompt: params.prompt,
        aspectRatio: params.aspectRatio || '16:9',
        duration: params.duration || 8,
        // ... map other params
      }),
    });

    const data = await response.json();
    return this.mapToJob(data);
  }

  // ... other methods
}
```

---

## 4. Agent Integration

### 4.1 Adding Video Tool to Agents

```typescript
// packages/agent/src/tools/video.ts

import { AgentTool } from '../implementations/enhanced_agent';
import { VideoGenerationTool } from '@the-new-fuse/mcp-core';

export const createVideoGenerationTool = (
  providers: VideoProviderConfig[]
): AgentTool => ({
  id: 'video-generation',
  name: 'Generate Video',
  description: `Generate AI videos using diffusion models. 
    Supports text-to-video and image-to-video generation.
    Available providers: ${providers.map((p) => p.name).join(', ')}`,
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Detailed description of the video to generate',
      },
      provider: {
        type: 'string',
        enum: providers.map((p) => p.name),
        description: 'Video generation provider to use',
      },
      duration: {
        type: 'number',
        description: 'Video duration in seconds (typically 4-16)',
        default: 8,
      },
      aspectRatio: {
        type: 'string',
        enum: ['16:9', '9:16', '1:1'],
        default: '16:9',
      },
      inputImageUrl: {
        type: 'string',
        description: 'Optional: URL of image to animate (for image-to-video)',
      },
    },
    required: ['prompt', 'provider'],
  },
  handler: async (input: unknown) => {
    const videoTool = new VideoGenerationTool(providers);
    return await videoTool.execute(input as VideoGenerationParams);
  },
});
```

### 4.2 Workflow Integration

```typescript
// Example workflow step for video generation

const videoGenerationStep: WorkflowStep = {
  id: 'generate-promo-video',
  type: StepType.TASK,
  name: 'Generate Promotional Video',
  task: {
    action: 'video-generation',
    params: {
      prompt: '{{workflow.inputs.productDescription}}',
      provider: 'veo',
      duration: 12,
      aspectRatio: '16:9',
      style: 'professional, cinematic lighting',
    },
  },
  assignee: {
    type: 'AGENT_TYPE',
    value: 'MEDIA_PRODUCER',
  },
  inputs: {
    productDescription: 'workflow.inputs.productDescription',
    brandColors: 'workflow.inputs.brandColors',
  },
  outputs: {
    videoUrl: 'result.videos[0].url',
    thumbnailUrl: 'result.videos[0].thumbnailUrl',
  },
  retryStrategy: {
    maxAttempts: 3,
    delayMs: 30000, // Video generation can take time
    backoffFactor: 2,
  },
  position: { x: 400, y: 200 },
};
```

---

## 5. User Interface Integration

### 5.1 Frontend Video Generation Component

```typescript
// apps/frontend/src/components/video/VideoGenerator.tsx

import React, { useState } from 'react';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';

interface VideoGeneratorProps {
  onVideoGenerated: (video: GeneratedVideo) => void;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onVideoGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<string>('veo');
  const { generate, isGenerating, progress, error } = useVideoGeneration();

  const handleGenerate = async () => {
    const result = await generate({
      prompt,
      provider,
      duration: 8,
      aspectRatio: '16:9'
    });

    if (result.success && result.videos.length > 0) {
      onVideoGenerated(result.videos[0]);
    }
  };

  return (
    <div className="video-generator">
      <h2>AI Video Generator</h2>

      <div className="form-group">
        <label>Describe your video</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A serene lake at sunset with gentle ripples on the water..."
          rows={4}
        />
      </div>

      <div className="form-group">
        <label>Provider</label>
        <select value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="veo">Google Veo 2</option>
          <option value="runway">Runway Gen-3</option>
          <option value="pika">Pika Labs</option>
          <option value="luma">Luma Dream Machine</option>
        </select>
      </div>

      <button onClick={handleGenerate} disabled={isGenerating || !prompt}>
        {isGenerating ? `Generating... ${progress}%` : 'Generate Video'}
      </button>

      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

### 5.2 API Endpoint

```typescript
// apps/api/src/modules/video/video.controller.ts

import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { VideoGenerationService } from './video.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

@Controller('video')
@UseGuards(JwtAuthGuard)
export class VideoController {
  constructor(private readonly videoService: VideoGenerationService) {}

  @Post('generate')
  @UseGuards(RateLimitGuard)
  async generateVideo(@Body() params: VideoGenerationParams) {
    return this.videoService.generate(params);
  }

  @Get('job/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.videoService.getJobStatus(jobId);
  }

  @Get('providers')
  async getProviders() {
    return this.videoService.getAvailableProviders();
  }
}
```

---

## 6. Extension System Integration

Create a video generation extension that can be dynamically loaded:

```typescript
// packages/extension-system/src/extensions/video-generation/manifest.json
{
  "id": "video-generation-extension",
  "name": "AI Video Generation",
  "version": "1.0.0",
  "description": "Integrates video diffusion models for AI video generation",
  "author": "The New Fuse",
  "type": "INTEGRATION",
  "entryPoint": "./dist/index.js",
  "dependencies": ["@the-new-fuse/mcp-core"],
  "hostVersion": ">=1.0.0",
  "configuration": {
    "providers": [
      {
        "name": "veo",
        "enabled": true,
        "apiKeyEnvVar": "VEO_API_KEY"
      },
      {
        "name": "runway",
        "enabled": true,
        "apiKeyEnvVar": "RUNWAY_API_KEY"
      }
    ]
  }
}
```

---

## 7. Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

- [ ] Create `IVideoProvider` interface
- [ ] Implement base `VideoGenerationTool`
- [ ] Add provider abstraction layer
- [ ] Create configuration schema

### Phase 2: Provider Implementations (Week 2-4)

- [ ] Implement `VeoProvider` (Google Veo 2)
- [ ] Implement `ReplicateProvider` (multiple models)
- [ ] Implement `RunwayProvider`
- [ ] Add rate limiting and cost tracking

### Phase 3: Agent Integration (Week 4-5)

- [ ] Add video tool to agent capabilities
- [ ] Create video-specialized agent type
- [ ] Update workflow engine for async video tasks
- [ ] Add progress tracking WebSocket events

### Phase 4: UI Implementation (Week 5-6)

- [ ] Create `VideoGenerator` component
- [ ] Add video preview player
- [ ] Implement job queue visualization
- [ ] Add cost estimation UI

### Phase 5: Advanced Features (Week 7+)

- [ ] Video-to-video transformations
- [ ] Batch video generation
- [ ] Video composition/editing
- [ ] Integration with asset library

---

## 8. Configuration & Environment Variables

```env
# Video Generation Providers
VEO_API_KEY=your-google-ai-api-key
RUNWAY_API_KEY=your-runway-api-key
REPLICATE_API_TOKEN=your-replicate-token
PIKA_API_KEY=your-pika-api-key
LUMA_API_KEY=your-luma-api-key

# Video Storage
VIDEO_STORAGE_PROVIDER=s3  # or gcs, local
VIDEO_STORAGE_BUCKET=generated-videos
VIDEO_CDN_URL=https://cdn.example.com/videos

# Rate Limiting
VIDEO_RATE_LIMIT_PER_USER=10  # per hour
VIDEO_RATE_LIMIT_GLOBAL=100   # per hour

# Cost Controls
VIDEO_MAX_COST_PER_REQUEST=5.00  # USD
VIDEO_MONTHLY_BUDGET=500.00      # USD
```

---

## 9. Cost Estimation Table

| Provider     | Model         | Duration | Est. Cost | Notes               |
| ------------ | ------------- | -------- | --------- | ------------------- |
| Google Veo 2 | veo-2         | 8 sec    | ~$0.50    | Via Gemini API      |
| Runway       | Gen-3 Alpha   | 5 sec    | $0.50     | 5 credits per video |
| Replicate    | SVD           | 4 sec    | ~$0.30    | Per prediction      |
| Pika         | Pika 1.0      | 3 sec    | ~$0.25    | Credits-based       |
| Luma         | Dream Machine | 5 sec    | ~$0.40    | Credits-based       |

---

## 10. Security Considerations

1. **API Key Management**: Store provider API keys in secrets manager (not env
   files in production)
2. **Content Moderation**: Implement prompt filtering before sending to
   providers
3. **Rate Limiting**: Prevent abuse with per-user and global rate limits
4. **Cost Controls**: Set maximum spend limits per request/user/month
5. **Output Validation**: Scan generated videos for problematic content
6. **Audit Logging**: Log all video generation requests for compliance

---

## 11. Next Steps

1. **Prioritize providers** based on your use case (recommend starting with
   Replicate for flexibility)
2. **Create the base infrastructure** following the MCP Tool pattern
3. **Implement one provider** end-to-end as a proof of concept
4. **Gather user feedback** on the UI/UX
5. **Iterate and expand** with additional providers and features

---

## Appendix A: Provider-Specific Notes

### Google Veo 2

- Access via Gemini API (requires Vertex AI or AI Studio)
- Excellent quality, competitive pricing
- Good for text-to-video and image-to-video

### Replicate

- Unified API for multiple models (SVD, AnimateDiff, etc.)
- Pay-per-prediction pricing
- Good for experimentation and model comparison

### Runway

- Professional-grade quality
- Strong image-to-video capabilities
- API in beta, check availability

### Luma Dream Machine

- Fast generation times
- Good for quick prototyping
- API available via their platform

---

## Appendix B: Related Codebase Files

- `packages/mcp-core/src/interfaces/IMCPTool.ts` - Tool interface pattern
- `packages/agent/src/implementations/enhanced_agent.ts` - Agent with tools
- `packages/workflow-engine/src/WorkflowTypes.ts` - Workflow task definitions
- `packages/extension-system/src/ExtensionTypes.ts` - Extension patterns
