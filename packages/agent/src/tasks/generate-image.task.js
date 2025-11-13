"use strict";
// Using custom WorkflowTask interface for this agent task definition
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateImageTask = void 0;
exports.GenerateImageTask = {
    id: 'generate-image-task',
    title: 'Generate an image',
    description: 'Generates an image from a text prompt using the Image Generation Tool.',
    steps: [
        {
            tool: 'image-generation-tool',
            args: {
                prompt: 'A beautiful landscape with mountains and a lake.',
                width: 1024,
                height: 1024,
            },
        },
    ],
};
//# sourceMappingURL=generate-image.task.js.map