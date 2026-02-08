---
name: nanobanana
description:
  Gemini 3 Pro Image generation skill (Nano Banana) for high-fidelity image
  creation
allowed-tools:
  - 'generate_image'
---

# Nano Banana (Gemini 3 Pro Image) Skill

This skill enables image generation using the Gemini 3 Pro Image model
(codenamed "Nano Banana").

## Usage

When the user asks to "generate an image", "create a picture", or specifically
mentions "Nano Banana" or "Gemini 3 Image", use this skill.

### Instructions

1.  **Refine the Prompt**: Ensure the image prompt is detailed and descriptive
    to take full advantage of the high-fidelity model.
2.  **Call the Tool**: Use the `generate_image` tool.
3.  **Model Specification**: Explicitly use the model ID `gemini-3-pro-image` if
    the tool supports a model parameter. If not, the system default will be
    used, but you should mention in the description that you are using the Nano
    Banana capability.

## Examples

**User:** "Generate a futuristic cityscape with neon lights." **Agent:** (Calls
`generate_image` with prompt: "High-fidelity futuristic cityscape, neon lights,
cyberpunk aesthetic, detailed textures, 8k resolution")

**User:** "Use Nano Banana to create a logo for a coffee shop." **Agent:**
(Calls `generate_image` with prompt: "Minimalist coffee shop logo, vector art
style, warm colors, clean lines")
