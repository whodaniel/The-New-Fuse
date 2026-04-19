import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
// @ts-ignore
// @ts-ignore
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DatabaseService, User } from '@the-new-fuse/database';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth, RateLimitTier, SetRateLimitTier } from '../guards/secure-auth.guard';
import {
  AgentPfpOverrideRecord,
  AgentPfpOverridesService,
} from '../services/agent-pfp-overrides.service';

interface AuthUser {
  id: string;
}

interface UpsertOverrideBody {
  namespace?: string;
  agentId: string;
  override: AgentPfpOverrideRecord;
}

interface BatchUpsertOverrideBody {
  namespace?: string;
  updates: Array<{
    agentId: string;
    override: AgentPfpOverrideRecord;
  }>;
}

interface GenerateImageBody {
  providerId: 'imfinit' | 'pollinations' | 'openai' | 'stability' | 'custom';
  modelId?: string;
  prompt: string;
  apiKey?: string;
  customEndpoint?: string;
}

@ApiTags('agent-pfp-overrides')
@Controller('agent-pfp-overrides')
@JwtAuth()
@SetRateLimitTier(RateLimitTier.API)
export class AgentPfpOverridesController {
  constructor(
    private readonly overridesService: AgentPfpOverridesService,
    private readonly db: DatabaseService
  ) {}

  @Get('access')
  @ApiOperation({ summary: 'Returns whether current user can save cloud PFP overrides' })
  @ApiResponse({ status: 200, description: 'Cloud access status' })
  async access(@CurrentUser() user: User) {
    if (!user || !user.id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.overridesService.getCloudAccess(user.id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to check cloud access',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'List cloud PFP overrides for current user namespace' })
  @ApiResponse({ status: 200, description: 'Override map' })
  async list(@CurrentUser() user: User, @Query('namespace') namespace?: string) {
    if (!user || !user.id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    try {
      const normalizedNamespace = this.normalizeNamespace(namespace);
      const overrides = await this.overridesService.listOverrides(user.id, normalizedNamespace);
      return { namespace: normalizedNamespace, overrides };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to list overrides',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Upsert a cloud PFP override for current user (paid members)' })
  @ApiResponse({ status: 200, description: 'Override persisted' })
  async upsert(@CurrentUser() user: User, @Body() body: UpsertOverrideBody) {
    if (!user || !user.id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    try {
      if (!body?.agentId || !body?.override?.imageUrl) {
        throw new BadRequestException('agentId and override.imageUrl are required');
      }

      const normalizedNamespace = this.normalizeNamespace(body.namespace);
      await this.overridesService.upsertOverride(
        user.id,
        normalizedNamespace,
        body.agentId,
        body.override,
        { requirePaid: true }
      );

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to upsert override',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch upsert cloud PFP overrides for current user (paid members)' })
  @ApiResponse({ status: 200, description: 'Batch persisted' })
  async upsertBatch(@CurrentUser() user: User, @Body() body: BatchUpsertOverrideBody) {
    if (!user || !user.id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    try {
      const updates = Array.isArray(body?.updates) ? body.updates : [];
      if (updates.length === 0) {
        throw new BadRequestException('updates is required');
      }

      const normalizedNamespace = this.normalizeNamespace(body.namespace);

      for (const update of updates) {
        if (!update?.agentId || !update?.override?.imageUrl) {
          continue;
        }
        await this.overridesService.upsertOverride(
          user.id,
          normalizedNamespace,
          update.agentId,
          update.override,
          { requirePaid: true }
        );
      }

      return { success: true, updated: updates.length };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to upsert batch overrides',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':agentId')
  @ApiOperation({ summary: 'Delete cloud PFP override for current user (paid members)' })
  @ApiResponse({ status: 200, description: 'Override deleted' })
  async remove(
    @CurrentUser() user: User,
    @Param('agentId') agentId: string,
    @Query('namespace') namespace?: string
  ) {
    if (!user || !user.id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    try {
      if (!agentId?.trim()) {
        throw new BadRequestException('agentId is required');
      }

      const normalizedNamespace = this.normalizeNamespace(namespace);
      await this.overridesService.removeOverride(user.id, normalizedNamespace, agentId, {
        requirePaid: true,
      });

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to remove override',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate PFP image through backend provider bridge' })
  @ApiResponse({ status: 200, description: 'Generated image data URL' })
  async generate(@CurrentUser() user: User, @Body() body: GenerateImageBody) {
    if (!user || !user.id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    try {
      const providerId = String(body?.providerId || '') as GenerateImageBody['providerId'];
      const prompt = String(body?.prompt || '').trim();
      const modelId = String(body?.modelId || '').trim();
      const customEndpoint = String(body?.customEndpoint || '').trim();

      if (!prompt) {
        throw new BadRequestException('prompt is required');
      }

      if (!providerId) {
        throw new BadRequestException('providerId is required');
      }

      const image = await this.generateImage({
        userId: user.id,
        providerId,
        modelId,
        prompt,
        apiKey: body?.apiKey,
        customEndpoint,
      });

      return {
        providerId,
        modelId: modelId || this.defaultModel(providerId),
        mimeType: image.mimeType,
        imageDataUrl: `data:${image.mimeType};base64,${image.buffer.toString('base64')}`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to generate image',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private async generateImage(input: {
    userId: string;
    providerId: GenerateImageBody['providerId'];
    modelId?: string;
    prompt: string;
    apiKey?: string;
    customEndpoint?: string;
  }): Promise<{ buffer: Buffer; mimeType: string }> {
    const provider = input.providerId;

    if (provider === 'imfinit') {
      const url = new URL('https://api.imfin.it/api/generate');
      url.searchParams.set('prompt', input.prompt);
      url.searchParams.set('ar', '1:1');
      url.searchParams.set('model', input.modelId || 'gemini');
      url.searchParams.set('reroll', 'true');

      const response = await fetch(url.toString());
      return this.readImageResponse(response);
    }

    if (provider === 'pollinations') {
      const seed = String(Date.now());
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(input.prompt)}?width=1024&height=1024&nologo=true&private=true&seed=${seed}`;
      const response = await fetch(url);
      return this.readImageResponse(response);
    }

    if (provider === 'openai') {
      const apiKey = await this.resolveApiKey(input.userId, 'openai', input.apiKey);
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: input.modelId || 'gpt-image-1',
          prompt: input.prompt,
          size: '1024x1024',
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new BadGatewayException(
          `OpenAI generation failed (${response.status}): ${body.slice(0, 180)}`
        );
      }

      const payload = (await response.json()) as {
        data?: Array<{ b64_json?: string; url?: string }>;
      };
      const entry = payload.data?.[0];

      if (entry?.b64_json) {
        return {
          buffer: Buffer.from(entry.b64_json, 'base64'),
          mimeType: 'image/png',
        };
      }

      if (entry?.url) {
        const imageResponse = await fetch(entry.url);
        return this.readImageResponse(imageResponse);
      }

      throw new BadGatewayException('OpenAI did not return an image payload');
    }

    if (provider === 'stability') {
      const apiKey = await this.resolveApiKey(input.userId, 'stability', input.apiKey);
      const isUltra = (input.modelId || '').includes('ultra');
      const endpoint = isUltra
        ? 'https://api.stability.ai/v2beta/stable-image/generate/ultra'
        : 'https://api.stability.ai/v2beta/stable-image/generate/core';

      const form = new FormData();
      form.append('prompt', input.prompt);
      form.append('output_format', 'png');
      form.append('aspect_ratio', '1:1');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'image/*',
        },
        body: form,
      });

      return this.readImageResponse(response);
    }

    if (provider === 'custom') {
      if (!input.customEndpoint) {
        throw new BadRequestException('customEndpoint is required for custom provider');
      }

      const response = await fetch(input.customEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(input.apiKey?.trim() ? { Authorization: `Bearer ${input.apiKey.trim()}` } : {}),
        },
        body: JSON.stringify({
          prompt: input.prompt,
          model: input.modelId || 'custom',
          size: '1024x1024',
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const payload = (await response.json()) as {
          imageUrl?: string;
          b64?: string;
        };

        if (payload.b64) {
          return {
            buffer: Buffer.from(payload.b64, 'base64'),
            mimeType: 'image/png',
          };
        }

        if (payload.imageUrl) {
          const imageResponse = await fetch(payload.imageUrl);
          return this.readImageResponse(imageResponse);
        }

        throw new BadGatewayException('Custom provider returned JSON without image payload');
      }

      return this.readImageResponse(response);
    }

    throw new BadRequestException(`Unsupported provider: ${provider}`);
  }

  private async resolveApiKey(
    userId: string,
    provider: string,
    inlineApiKey?: string
  ): Promise<string> {
    const inline = String(inlineApiKey || '').trim();
    if (inline) return inline;

    const persisted = await this.db.providerApiKeys.findDecryptedByUserAndProvider(
      userId,
      provider
    );
    if (persisted?.apiKey?.trim()) {
      return persisted.apiKey.trim();
    }

    throw new BadRequestException(
      `No API key found for ${provider}. Add one in API settings or pass apiKey in request.`
    );
  }

  private async readImageResponse(
    response: Response
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new BadGatewayException(
        `Image provider request failed (${response.status}): ${body.slice(0, 180)}`
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) {
      throw new ServiceUnavailableException('Image provider returned an empty image payload');
    }

    const mimeType = response.headers.get('content-type') || 'image/png';
    return { buffer, mimeType };
  }

  private defaultModel(provider: GenerateImageBody['providerId']): string {
    if (provider === 'imfinit') return 'gemini';
    if (provider === 'pollinations') return 'flux';
    if (provider === 'openai') return 'gpt-image-1';
    if (provider === 'stability') return 'stable-image-core';
    return 'custom';
  }

  private normalizeNamespace(namespace?: string): string {
    const normalized = String(namespace || 'global')
      .trim()
      .replace(/[^a-zA-Z0-9:_-]+/g, '_')
      .slice(0, 120);
    return normalized || 'global';
  }
}
