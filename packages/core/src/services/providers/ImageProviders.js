"use strict";
/**
 * Image Generation Provider Configurations
 *
 * Configurations for the best image generation models as of October 2025
 *
 * @module ImageProviders
 * @since 2025-10-06
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMAGE_PROVIDERS = void 0;
const GenerativeMediaProviderRegistry_1 = require("../GenerativeMediaProviderRegistry");
exports.IMAGE_PROVIDERS = [
    {
        id: 'recraft-v3',
        name: 'Recraft V3',
        displayName: 'Recraft V3 - Leading Image Generator',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.API_DIRECT,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE],
        endpoint: 'https://api.recraft.ai/v1/',
        models: [
            {
                id: 'recraft-v3',
                name: 'Recraft V3',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.IMAGE,
                description: 'State-of-the-art image generation with best text rendering',
                maxResolution: '2048x2048',
                pricing: {
                    model: 'per_generation',
                    cost: 0.04,
                    currency: 'USD',
                    unit: 'image'
                }
            }
        ],
        capabilities: [
            { name: 'text_rendering', description: 'Excellent text in images', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'brand_consistency', description: 'Consistent brand elements', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'high_resolution', description: 'High resolution output', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'style_control', description: 'Precise style control', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] }
        ],
        pricing: {
            model: 'per_generation',
            cost: 0.04,
            currency: 'USD',
            unit: 'image'
        },
        priority: 95,
        status: 'checking',
        metadata: {
            vendor: 'Recraft',
            version: '3.0',
            description: 'Leading image generation model with superior text rendering and brand consistency',
            documentation: 'https://docs.recraft.ai/',
            tags: ['image', 'text-rendering', 'branding', 'premium'],
            maxDimensions: { width: 2048, height: 2048 },
            supportedFormats: ['PNG', 'JPEG', 'WEBP']
        }
    },
    {
        id: 'flux-1-1-pro',
        name: 'FLUX 1.1 Pro',
        displayName: 'FLUX 1.1 Pro - Fastest Generation',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.REPLICATE,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE],
        endpoint: 'https://api.replicate.com/v1/predictions',
        models: [
            {
                id: 'flux-1-1-pro',
                name: 'FLUX 1.1 Pro',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.IMAGE,
                description: 'Ultra-fast image generation (2-4 seconds)',
                maxResolution: '2048x2048',
                pricing: {
                    model: 'per_generation',
                    cost: 0.025,
                    currency: 'USD',
                    unit: 'image',
                }
            },
            {
                id: 'flux-1-dev',
                name: 'FLUX 1 Dev',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.IMAGE,
                description: 'Open source variant for development',
                maxResolution: '1024x1024',
                pricing: {
                    model: 'per_generation',
                    cost: 0.01,
                    currency: 'USD',
                    unit: 'image'
                }
            }
        ],
        capabilities: [
            { name: 'fast_generation', description: 'Ultra-fast 2-4 second generation', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'open_source', description: 'Open source variants available', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'fine_tuning', description: 'Support for fine-tuning', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'batch_processing', description: 'Efficient batch generation', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] }
        ],
        pricing: {
            model: 'per_generation',
            cost: 0.025,
            currency: 'USD',
            unit: 'image'
        },
        priority: 90,
        status: 'checking',
        metadata: {
            vendor: 'Black Forest Labs',
            version: '1.1',
            description: 'Fastest image generation model with excellent quality',
            documentation: 'https://docs.flux.ai/',
            tags: ['image', 'fast', 'open-source', 'quality'],
            maxDimensions: { width: 2048, height: 2048 },
            supportedFormats: ['PNG', 'JPEG']
        }
    },
    {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        displayName: 'DALL-E 3 - OpenAI Image Generator',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.API_DIRECT,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE],
        endpoint: 'https://api.openai.com/v1/images/generations',
        models: [
            {
                id: 'dall-e-3',
                name: 'DALL-E 3',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.IMAGE,
                description: 'OpenAI\'s latest image generation model',
                maxResolution: '1024x1024',
                pricing: {
                    model: 'per_generation',
                    cost: 0.06,
                    currency: 'USD',
                    unit: 'image',
                }
            },
            {
                id: 'dall-e-3-hd',
                name: 'DALL-E 3 HD',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.IMAGE,
                description: 'High definition variant',
                maxResolution: '1792x1024',
                pricing: {
                    model: 'per_generation',
                    cost: 0.12,
                    currency: 'USD',
                    unit: 'image'
                }
            }
        ],
        capabilities: [
            { name: 'prompt_adherence', description: 'Excellent prompt following', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'safety_filtering', description: 'Built-in safety measures', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'natural_language', description: 'Natural language prompts', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'creative_interpretation', description: 'Creative prompt interpretation', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] }
        ],
        pricing: {
            model: 'per_generation',
            cost: 0.06,
            currency: 'USD',
            unit: 'image'
        },
        priority: 85,
        status: 'checking',
        metadata: {
            vendor: 'OpenAI',
            version: '3.0',
            description: 'OpenAI\'s flagship image generation model with excellent prompt adherence',
            documentation: 'https://platform.openai.com/docs/guides/images',
            tags: ['image', 'openai', 'safety', 'prompt-adherence'],
            maxDimensions: { width: 1792, height: 1024 },
            supportedFormats: ['PNG']
        }
    },
    {
        id: 'midjourney-v6-1',
        name: 'Midjourney v6.1',
        displayName: 'Midjourney v6.1 - Artistic Leader',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.DISCORD_BOT,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE],
        endpoint: 'https://discord.com/api/v10/',
        models: [
            {
                id: 'midjourney-v6-1',
                name: 'Midjourney v6.1',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.IMAGE,
                description: 'Leading artistic image generation',
                maxResolution: '2048x2048',
                pricing: {
                    model: 'subscription',
                    cost: 30,
                    currency: 'USD',
                    unit: 'month'
                }
            }
        ],
        capabilities: [
            { name: 'artistic_style', description: 'Superior artistic composition', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'style_consistency', description: 'Consistent artistic style', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'upscaling', description: 'Built-in upscaling options', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'variations', description: 'Generate variations of images', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] }
        ],
        pricing: {
            model: 'subscription',
            cost: 30,
            currency: 'USD',
            unit: 'month'
        },
        priority: 88,
        status: 'checking',
        metadata: {
            vendor: 'Midjourney',
            version: '6.1',
            description: 'Leading artistic image generation with superior composition and style',
            documentation: 'https://docs.midjourney.com/',
            tags: ['image', 'artistic', 'composition', 'premium'],
            maxDimensions: { width: 2048, height: 2048 },
            supportedFormats: ['PNG', 'JPEG']
        }
    },
    {
        id: 'stable-diffusion-3-5',
        name: 'Stable Diffusion 3.5',
        displayName: 'Stable Diffusion 3.5 - Open Source Leader',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.SELF_HOSTED,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE],
        endpoint: 'http://localhost:7860/api/v1/',
        models: [
            {
                id: 'sd-3-5-large',
                name: 'SD 3.5 Large',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.IMAGE,
                description: 'Large model for highest quality',
                maxResolution: '2048x2048',
                pricing: {
                    model: 'per_generation',
                    cost: 0,
                    currency: 'USD',
                    unit: 'image',
                }
            },
            {
                id: 'sd-3-5-medium',
                name: 'SD 3.5 Medium',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.IMAGE,
                description: 'Balanced quality and speed',
                maxResolution: '1536x1536',
                pricing: {
                    model: 'per_generation',
                    cost: 0,
                    currency: 'USD',
                    unit: 'image'
                }
            }
        ],
        capabilities: [
            { name: 'open_source', description: 'Fully open source', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'fine_tuning', description: 'Extensive fine-tuning support', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'custom_models', description: 'Custom model training', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'controlnet', description: 'ControlNet integration', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'inpainting', description: 'Image inpainting', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'img2img', description: 'Image-to-image generation', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] }
        ],
        pricing: {
            model: 'per_generation',
            cost: 0,
            currency: 'USD',
            unit: 'image'
        },
        priority: 75,
        status: 'checking',
        metadata: {
            vendor: 'Stability AI',
            version: '3.5',
            description: 'Open source image generation with extensive customization options',
            documentation: 'https://stability.ai/docs/',
            tags: ['image', 'open-source', 'customizable', 'free'],
            maxDimensions: { width: 2048, height: 2048 },
            supportedFormats: ['PNG', 'JPEG', 'WEBP']
        }
    },
    {
        id: 'ideogram-2-0',
        name: 'Ideogram 2.0',
        displayName: 'Ideogram 2.0 - Text Specialist',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.API_DIRECT,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE],
        endpoint: 'https://api.ideogram.ai/v1/',
        models: [
            {
                id: 'ideogram-2-0',
                name: 'Ideogram 2.0',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.IMAGE,
                description: 'Specialized in text rendering and logos',
                maxResolution: '1024x1024',
                pricing: {
                    model: 'per_generation',
                    cost: 0.02,
                    currency: 'USD',
                    unit: 'image'
                }
            }
        ],
        capabilities: [
            { name: 'text_rendering', description: 'Excellent text in images', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'logo_design', description: 'Logo and brand design', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'typography', description: 'Advanced typography', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] },
            { name: 'vector_style', description: 'Vector-style outputs', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.IMAGE] }
        ],
        pricing: {
            model: 'per_generation',
            cost: 0.02,
            currency: 'USD',
            unit: 'image'
        },
        priority: 80,
        status: 'checking',
        metadata: {
            vendor: 'Ideogram',
            version: '2.0',
            description: 'Specialized image generation for text, logos, and typography',
            documentation: 'https://docs.ideogram.ai/',
            tags: ['image', 'text', 'logo', 'typography'],
            maxDimensions: { width: 1024, height: 1024 },
            supportedFormats: ['PNG', 'JPEG']
        }
    }
];
//# sourceMappingURL=ImageProviders.js.map