# Agent PFP Catalog

This directory is the landing zone for generated agent profile pictures.

Use the prompt catalog in:

- `apps/frontend/src/data/agent-visual-profiles.json`

Recommended naming:

- `${agent.slug}.png`
- `${agent.slug}.webp`
- `${agent.slug}.jpg`

Lookup behavior:

- The frontend/backend avatar resolvers first try a file that matches the agent slug.
- If no static file exists yet, the app falls back to generated placeholder avatars.

Suggested workflow:

1. Copy `promptSpec.imagePrompt` for the agent you want.
2. Use Gemini Nano Banana 2 to render a square portrait.
3. Save the image here with the agent slug as the filename.
4. Regenerate or refresh the app and the portrait will be picked up automatically.
