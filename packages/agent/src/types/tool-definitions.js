"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageGenerationTool = void 0;
exports.ImageGenerationTool = {
    id: 'image-generation-tool',
    name: 'Image Generation Tool',
    description: 'Generates an image from a text prompt.',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: { type: 'string' },
            width: { type: 'number' },
            height: { type: 'number' },
        },
        required: ['prompt'],
    },
    outputSchema: {
        type: 'object',
        properties: {
            imageUrl: { type: 'string' },
        },
    },
};
//# sourceMappingURL=tool-definitions.js.map