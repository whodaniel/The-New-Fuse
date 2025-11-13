"use strict";
/**
 * Audio Generation Provider Configurations
 *
 * Configurations for the best audio generation models as of October 2025
 *
 * @module AudioProviders
 * @since 2025-10-06
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUDIO_PROVIDERS = void 0;
const GenerativeMediaProviderRegistry_1 = require("../GenerativeMediaProviderRegistry");
exports.AUDIO_PROVIDERS = [
    // Music Generation Models
    {
        id: 'suno-v4',
        name: 'Suno v4',
        displayName: 'Suno v4 - Leading Music AI',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.API_DIRECT,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC, GenerativeMediaProviderRegistry_1.MediaType.AUDIO],
        endpoint: 'https://api.suno.ai/v1/',
        models: [
            {
                id: 'suno-v4',
                name: 'Suno v4',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.MUSIC,
                description: 'Full song generation with lyrics and vocals',
                maxDuration: 240,
                pricing: {
                    model: 'per_generation',
                    cost: 0.30,
                    currency: 'USD',
                    unit: 'song',
                }
            },
            {
                id: 'suno-v4-instrumental',
                name: 'Suno v4 Instrumental',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.MUSIC,
                description: 'Instrumental music generation',
                maxDuration: 240,
                pricing: {
                    model: 'per_generation',
                    cost: 0.20,
                    currency: 'USD',
                    unit: 'song'
                }
            }
        ],
        capabilities: [
            { name: 'full_songs', description: 'Generate complete songs', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC] },
            { name: 'lyrics_generation', description: 'Generate lyrics with music', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC] },
            { name: 'vocal_synthesis', description: 'Synthesize vocals', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC] },
            { name: 'genre_variety', description: 'Wide variety of genres', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC] },
            { name: 'custom_style', description: 'Custom musical styles', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC] }
        ],
        pricing: {
            model: 'per_generation',
            cost: 0.30,
            currency: 'USD',
            unit: 'song'
        },
        priority: 95,
        status: 'checking',
        metadata: {
            vendor: 'Suno',
            version: '4.0',
            description: 'Leading AI music generation with full song creation including lyrics and vocals',
            documentation: 'https://docs.suno.ai/',
            tags: ['music', 'vocals', 'lyrics', 'full-songs'],
            maxDuration: 240,
            supportedFormats: ['MP3', 'WAV', 'FLAC']
        }
    },
    {
        id: 'udio-v2',
        name: 'Udio v2',
        displayName: 'Udio v2 - High-Quality Music',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.API_DIRECT,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC, GenerativeMediaProviderRegistry_1.MediaType.AUDIO],
        endpoint: 'https://api.udio.com/v1/',
        models: [
            {
                id: 'udio-v2',
                name: 'Udio v2',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.MUSIC,
                description: 'High-quality music generation with genre variety',
                maxDuration: 180,
                pricing: {
                    model: 'per_generation',
                    cost: 0.40,
                    currency: 'USD',
                    unit: 'song'
                }
            }
        ],
        capabilities: [
            { name: 'high_audio_quality', description: 'Superior audio quality', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC] },
            { name: 'genre_mastery', description: 'Excellent genre understanding', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC] },
            { name: 'professional_mixing', description: 'Professional-grade mixing', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC] },
            { name: 'extended_compositions', description: 'Extended musical compositions', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC] }
        ],
        pricing: {
            model: 'per_generation',
            cost: 0.40,
            currency: 'USD',
            unit: 'song'
        },
        priority: 90,
        status: 'checking',
        metadata: {
            vendor: 'Udio',
            version: '2.0',
            description: 'High-quality music generation with superior audio fidelity and genre mastery',
            documentation: 'https://docs.udio.com/',
            tags: ['music', 'high-quality', 'professional', 'genres'],
            maxDuration: 180,
            supportedFormats: ['MP3', 'WAV']
        }
    },
    {
        id: 'stable-audio-2-5',
        name: 'Stable Audio 2.5',
        displayName: 'Stable Audio 2.5 - Open Source Music',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.SELF_HOSTED,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC, GenerativeMediaProviderRegistry_1.MediaType.AUDIO],
        endpoint: 'http://localhost:7862/api/v1/',
        models: [
            {
                id: 'stable-audio-2-5',
                name: 'Stable Audio 2.5',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.MUSIC,
                description: 'Open source music and sound generation',
                maxDuration: 120,
                pricing: {
                    model: 'per_generation',
                    cost: 0,
                    currency: 'USD',
                    unit: 'audio'
                }
            }
        ],
        capabilities: [
            { name: 'open_source', description: 'Fully open source', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC, GenerativeMediaProviderRegistry_1.MediaType.AUDIO] },
            { name: 'sound_effects', description: 'Generate sound effects', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.AUDIO] },
            { name: 'music_generation', description: 'Generate music', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC] },
            { name: 'customizable', description: 'Highly customizable', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC, GenerativeMediaProviderRegistry_1.MediaType.AUDIO] },
            { name: 'fine_tuning', description: 'Support for fine-tuning', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.MUSIC, GenerativeMediaProviderRegistry_1.MediaType.AUDIO] }
        ],
        pricing: {
            model: 'per_generation',
            cost: 0,
            currency: 'USD',
            unit: 'audio'
        },
        priority: 75,
        status: 'checking',
        metadata: {
            vendor: 'Stability AI',
            version: '2.5',
            description: 'Open source audio generation for music and sound effects',
            documentation: 'https://stability.ai/docs/audio',
            tags: ['music', 'audio', 'open-source', 'sound-effects'],
            maxDuration: 120,
            supportedFormats: ['WAV', 'MP3', 'FLAC']
        }
    },
    // Voice Generation Models
    {
        id: 'elevenlabs-v3',
        name: 'ElevenLabs v3',
        displayName: 'ElevenLabs v3 - Premium Voice Cloning',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.API_DIRECT,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE, GenerativeMediaProviderRegistry_1.MediaType.AUDIO],
        endpoint: 'https://api.elevenlabs.io/v1/',
        models: [
            {
                id: 'eleven-turbo-v2',
                name: 'Eleven Turbo v2',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.VOICE,
                description: 'Fast, high-quality voice synthesis',
                pricing: {
                    model: 'per_character',
                    cost: 0.0003,
                    currency: 'USD',
                    unit: 'character',
                }
            },
            {
                id: 'eleven-multilingual-v2',
                name: 'Eleven Multilingual v2',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.VOICE,
                description: 'Multilingual voice synthesis',
                pricing: {
                    model: 'per_character',
                    cost: 0.0004,
                    currency: 'USD',
                    unit: 'character'
                }
            }
        ],
        capabilities: [
            { name: 'voice_cloning', description: 'Advanced voice cloning', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE] },
            { name: 'emotion_control', description: 'Emotional voice control', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE] },
            { name: 'multilingual', description: 'Multiple language support', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE] },
            { name: 'real_time', description: 'Real-time voice synthesis', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE] },
            { name: 'custom_voices', description: 'Create custom voices', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE] }
        ],
        pricing: {
            model: 'per_character',
            cost: 0.0003,
            currency: 'USD',
            unit: 'character'
        },
        priority: 95,
        status: 'checking',
        metadata: {
            vendor: 'ElevenLabs',
            version: '3.0',
            description: 'Premium voice cloning and synthesis with emotion control',
            documentation: 'https://docs.elevenlabs.io/',
            tags: ['voice', 'cloning', 'emotion', 'multilingual'],
            supportedFormats: ['MP3', 'WAV', 'PCM']
        }
    },
    {
        id: 'openai-tts-hd',
        name: 'OpenAI TTS-HD',
        displayName: 'OpenAI TTS-HD - High-Quality Speech',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.API_DIRECT,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE, GenerativeMediaProviderRegistry_1.MediaType.AUDIO],
        endpoint: 'https://api.openai.com/v1/audio/speech',
        models: [
            {
                id: 'tts-1-hd',
                name: 'TTS-1-HD',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.VOICE,
                description: 'High-definition text-to-speech',
                pricing: {
                    model: 'per_character',
                    cost: 0.000015,
                    currency: 'USD',
                    unit: 'character',
                }
            },
            {
                id: 'tts-1',
                name: 'TTS-1',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.VOICE,
                description: 'Standard text-to-speech',
                pricing: {
                    model: 'per_character',
                    cost: 0.000015,
                    currency: 'USD',
                    unit: 'character'
                }
            }
        ],
        capabilities: [
            { name: 'natural_voices', description: 'Natural-sounding voices', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE] },
            { name: 'multiple_voices', description: 'Multiple voice options', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE] },
            { name: 'speed_control', description: 'Adjustable speech speed', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE] },
            { name: 'cost_effective', description: 'Very cost-effective', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE] }
        ],
        pricing: {
            model: 'per_character',
            cost: 0.000015,
            currency: 'USD',
            unit: 'character'
        },
        priority: 85,
        status: 'checking',
        metadata: {
            vendor: 'OpenAI',
            version: '1.0-HD',
            description: 'High-quality text-to-speech with natural voices',
            documentation: 'https://platform.openai.com/docs/guides/text-to-speech',
            tags: ['voice', 'tts', 'natural', 'cost-effective'],
            supportedFormats: ['MP3', 'OPUS', 'AAC', 'FLAC']
        }
    },
    {
        id: 'murf-ai',
        name: 'Murf AI',
        displayName: 'Murf AI - Professional Voiceovers',
        type: GenerativeMediaProviderRegistry_1.MediaProviderType.API_DIRECT,
        mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE, GenerativeMediaProviderRegistry_1.MediaType.AUDIO],
        endpoint: 'https://api.murf.ai/v1/',
        models: [
            {
                id: 'murf-studio',
                name: 'Murf Studio',
                mediaType: GenerativeMediaProviderRegistry_1.MediaType.VOICE,
                description: 'Professional voiceover generation',
                pricing: {
                    model: 'subscription',
                    cost: 29,
                    currency: 'USD',
                    unit: 'month'
                }
            }
        ],
        capabilities: [
            { name: 'professional_voices', description: 'Professional-grade voices', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE] },
            { name: 'business_focused', description: 'Business and commercial use', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE] },
            { name: 'emotion_control', description: 'Emotional voice control', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE] },
            { name: 'script_editing', description: 'Built-in script editing', supported: true, mediaTypes: [GenerativeMediaProviderRegistry_1.MediaType.VOICE] }
        ],
        pricing: {
            model: 'subscription',
            cost: 29,
            currency: 'USD',
            unit: 'month'
        },
        priority: 80,
        status: 'checking',
        metadata: {
            vendor: 'Murf',
            version: '2.0',
            description: 'Professional voiceover generation for business and commercial use',
            documentation: 'https://docs.murf.ai/',
            tags: ['voice', 'professional', 'business', 'commercial'],
            supportedFormats: ['MP3', 'WAV']
        }
    }
];
//# sourceMappingURL=AudioProviders.js.map