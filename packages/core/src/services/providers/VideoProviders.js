"use strict";
/**
 * Video Generation Provider Configurations
 *
 * Configurations for the best video generation models as of October 2025
 *
 * @module VideoProviders
 * @since 2025-10-06
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VIDEO_PROVIDERS = void 0;
const GenerativeMediaProviderRegistry_1 = require("../GenerativeMediaProviderRegistry");
exports.VIDEO_PROVIDERS = [
    {
        id: 'sora-2-0',
        name: 'Sora 2.0',
        displayName: 'OpenAI Sora 2.0 - Most Advanced',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.API_DIRECT,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO],
        endpoint: 'https://api.openai.com/v1/video/generations',
        models: [
            {
                id: 'sora-2-0',
                name: 'Sora 2.0',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.VIDEO,
                description: 'Most advanced video generation with physics simulation',
                maxDuration: 60,
                pricing: {
                    model: 'per_second',
                    cost: 0.10,
                    currency: 'USD',
                    unit: 'second',
                }
            },
            {
                id: 'sora-2-0-turbo',
                name: 'Sora 2.0 Turbo',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.VIDEO,
                description: 'Faster generation with good quality',
                maxDuration: 30,
                pricing: {
                    model: 'per_second',
                    cost: 0.05,
                    currency: 'USD',
                    unit: 'second'
                }
            }
        ],
        capabilities: [
            { name: 'physics_simulation', description: 'Realistic physics simulation', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'long_videos', description: 'Generate videos up to 60 seconds', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'camera_control', description: 'Camera movement control', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'temporal_consistency', description: 'Excellent temporal consistency', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'complex_scenes', description: 'Complex multi-object scenes', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] }
        ],
        pricing: {
            model: 'per_second',
            cost: 0.10,
            currency: 'USD',
            unit: 'second'
        },
        priority: 95,
        status: 'checking',
        metadata: {
            vendor: 'OpenAI',
            version: '2.0',
            description: 'Most advanced video generation model with realistic physics and long duration support',
            documentation: 'https://platform.openai.com/docs/guides/video',
            tags: ['video', 'physics', 'long-form', 'premium'],
            maxDuration: 60,
            supportedFormats: ['MP4', 'MOV']
        }
    },
    {
        id: 'runway-gen3-alpha',
        name: 'Runway Gen-3 Alpha',
        displayName: 'Runway Gen-3 Alpha - Professional Standard',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.API_DIRECT,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO],
        endpoint: 'https://api.runwayml.com/v1/',
        models: [
            {
                id: 'gen3-alpha',
                name: 'Gen-3 Alpha',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.VIDEO,
                description: 'Professional video generation with motion control',
                maxDuration: 10,
                pricing: {
                    model: 'per_generation',
                    cost: 0.75,
                    currency: 'USD',
                    unit: 'video',
                }
            },
            {
                id: 'gen3-alpha-turbo',
                name: 'Gen-3 Alpha Turbo',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.VIDEO,
                description: 'Faster generation for quick iterations',
                maxDuration: 5,
                pricing: {
                    model: 'per_generation',
                    cost: 0.40,
                    currency: 'USD',
                    unit: 'video'
                }
            }
        ],
        capabilities: [
            { name: 'motion_control', description: 'Precise motion control', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'style_consistency', description: 'Consistent visual style', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'img2video', description: 'Image to video generation', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'video_editing', description: 'Video editing capabilities', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'professional_quality', description: 'Professional-grade output', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] }
        ],
        pricing: {
            model: 'per_generation',
            cost: 0.75,
            currency: 'USD',
            unit: 'video'
        },
        priority: 90,
        status: 'checking',
        metadata: {
            vendor: 'Runway',
            version: '3.0-alpha',
            description: 'Professional video generation with advanced motion control and editing features',
            documentation: 'https://docs.runwayml.com/',
            tags: ['video', 'professional', 'motion-control', 'editing'],
            maxDuration: 10,
            supportedFormats: ['MP4', 'GIF']
        }
    },
    {
        id: 'kling-ai',
        name: 'Kling AI',
        displayName: 'Kling AI - High Quality Chinese Model',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.API_DIRECT,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO],
        endpoint: 'https://api.kling.ai/v1/',
        models: [
            {
                id: 'kling-v1',
                name: 'Kling v1',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.VIDEO,
                description: 'High-quality video generation with long duration support',
                maxDuration: 30,
                pricing: {
                    model: 'per_generation',
                    cost: 0.60,
                    currency: 'USD',
                    unit: 'video'
                }
            }
        ],
        capabilities: [
            { name: 'long_duration', description: 'Generate videos up to 30 seconds', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'high_resolution', description: 'High resolution output', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'realistic_motion', description: 'Realistic motion and physics', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'scene_understanding', description: 'Complex scene understanding', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] }
        ],
        pricing: {
            model: 'per_generation',
            cost: 0.60,
            currency: 'USD',
            unit: 'video'
        },
        priority: 85,
        status: 'checking',
        metadata: {
            vendor: 'Kuaishou',
            version: '1.0',
            description: 'High-quality video generation model with excellent realism and long duration support',
            documentation: 'https://docs.kling.ai/',
            tags: ['video', 'high-quality', 'long-duration', 'realistic'],
            maxDuration: 30,
            supportedFormats: ['MP4']
        }
    },
    {
        id: 'luma-dream-machine',
        name: 'Luma Dream Machine',
        displayName: 'Luma Dream Machine (Ray2) - Fast Generation',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.API_DIRECT,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO],
        endpoint: 'https://api.lumalabs.ai/dream-machine/v1/',
        models: [
            {
                id: 'ray2',
                name: 'Ray2',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.VIDEO,
                description: 'Fast video generation with good quality',
                maxDuration: 5,
                pricing: {
                    model: 'per_generation',
                    cost: 0.30,
                    currency: 'USD',
                    unit: 'video'
                }
            }
        ],
        capabilities: [
            { name: 'fast_generation', description: 'Quick video generation', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'accessible_pricing', description: 'Cost-effective pricing', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'good_quality', description: 'Good quality output', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'user_friendly', description: 'Easy to use interface', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] }
        ],
        pricing: {
            model: 'per_generation',
            cost: 0.30,
            currency: 'USD',
            unit: 'video'
        },
        priority: 80,
        status: 'checking',
        metadata: {
            vendor: 'Luma Labs',
            version: '2.0',
            description: 'Fast and accessible video generation with good quality output',
            documentation: 'https://docs.lumalabs.ai/',
            tags: ['video', 'fast', 'accessible', 'cost-effective'],
            maxDuration: 5,
            supportedFormats: ['MP4']
        }
    },
    {
        id: 'pika-2-2',
        name: 'Pika 2.2',
        displayName: 'Pika 2.2 - Creative Effects',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.API_DIRECT,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO],
        endpoint: 'https://api.pika.art/v1/',
        models: [
            {
                id: 'pika-2-2',
                name: 'Pika 2.2',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.VIDEO,
                description: 'Creative video generation with special effects',
                maxDuration: 4,
                pricing: {
                    model: 'per_generation',
                    cost: 0.25,
                    currency: 'USD',
                    unit: 'video'
                }
            }
        ],
        capabilities: [
            { name: 'special_effects', description: 'Creative special effects', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'transformations', description: 'Object transformations', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'creative_style', description: 'Creative and artistic styles', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'quick_iterations', description: 'Fast iteration cycles', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] }
        ],
        pricing: {
            model: 'per_generation',
            cost: 0.25,
            currency: 'USD',
            unit: 'video'
        },
        priority: 75,
        status: 'checking',
        metadata: {
            vendor: 'Pika Labs',
            version: '2.2',
            description: 'Creative video generation with special effects and transformations',
            documentation: 'https://docs.pika.art/',
            tags: ['video', 'creative', 'effects', 'transformations'],
            maxDuration: 4,
            supportedFormats: ['MP4', 'GIF']
        }
    },
    {
        id: 'haiper-ai',
        name: 'Haiper AI',
        displayName: 'Haiper AI - Emerging Competitor',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.API_DIRECT,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO],
        endpoint: 'https://api.haiper.ai/v1/',
        models: [
            {
                id: 'haiper-v1',
                name: 'Haiper v1',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.VIDEO,
                description: 'Cost-effective video generation with good quality',
                maxDuration: 6,
                pricing: {
                    model: 'per_generation',
                    cost: 0.20,
                    currency: 'USD',
                    unit: 'video'
                }
            }
        ],
        capabilities: [
            { name: 'cost_effective', description: 'Very cost-effective pricing', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'good_quality', description: 'Good quality for the price', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'reliable', description: 'Reliable generation', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'emerging', description: 'Rapidly improving model', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] }
        ],
        pricing: {
            model: 'per_generation',
            cost: 0.20,
            currency: 'USD',
            unit: 'video'
        },
        priority: 70,
        status: 'checking',
        metadata: {
            vendor: 'Haiper',
            version: '1.0',
            description: 'Emerging video generation model with excellent cost-effectiveness',
            documentation: 'https://docs.haiper.ai/',
            tags: ['video', 'cost-effective', 'emerging', 'reliable'],
            maxDuration: 6,
            supportedFormats: ['MP4']
        }
    },
    {
        id: 'stable-video-diffusion',
        name: 'Stable Video Diffusion',
        displayName: 'Stable Video Diffusion - Open Source',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.SELF_HOSTED,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO],
        endpoint: 'http://localhost:7861/api/v1/',
        models: [
            {
                id: 'svd-xt',
                name: 'SVD-XT',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.VIDEO,
                description: 'Extended temporal model for longer videos',
                maxDuration: 4,
                pricing: {
                    model: 'per_generation',
                    cost: 0,
                    currency: 'USD',
                    unit: 'video',
                }
            },
            {
                id: 'svd-img2vid',
                name: 'SVD Image-to-Video',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.VIDEO,
                description: 'Convert images to videos',
                maxDuration: 2,
                pricing: {
                    model: 'per_generation',
                    cost: 0,
                    currency: 'USD',
                    unit: 'video'
                }
            }
        ],
        capabilities: [
            { name: 'open_source', description: 'Fully open source', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'customizable', description: 'Highly customizable', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'img2video', description: 'Image to video conversion', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'fine_tuning', description: 'Support for fine-tuning', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] },
            { name: 'free', description: 'Free to use', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VIDEO] }
        ],
        pricing: {
            model: 'per_generation',
            cost: 0,
            currency: 'USD',
            unit: 'video'
        },
        priority: 65,
        status: 'checking',
        metadata: {
            vendor: 'Stability AI',
            version: '1.1',
            description: 'Open source video generation with customization options',
            documentation: 'https://stability.ai/docs/video',
            tags: ['video', 'open-source', 'customizable', 'free'],
            maxDuration: 4,
            supportedFormats: ['MP4', 'GIF']
        }
    }
];
//# sourceMappingURL=VideoProviders.js.map