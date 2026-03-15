<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio:
https://ai.studio/apps/41c045b3-f3a1-4a92-b0be-a06750b4a72d

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app: `npm run dev`

## Community Build Module (AI-ARCADE)

AI-ARCADE now includes a community apps module for member-generated games:

- Lobby route: `COMMUNITY APPS`
- List endpoint: `GET /api/community/apps`
- Submission endpoint: `POST /api/community/apps/submit`
- Upvote endpoint: `POST /api/community/apps/:appId/vote`
- Engagement endpoint: `POST /api/community/apps/:appId/engagement`
- Trends endpoint: `GET /api/community/apps/:appId/trends`
- Achievements endpoint: `GET /api/community/apps/:appId/achievements`
- Comments list: `GET /api/community/apps/:appId/comments`
- Comment create: `POST /api/community/apps/:appId/comments`
- Recent activity feed: `GET /api/community/activities/recent`
- Persistence status: `GET /api/community/persistence/status`

Persistence and Cloudflare-ready exports:

- Local durable state: `.data/community-state.json`
- D1 SQL export: `.data/cloudflare-export/community-d1-seed.sql`
- R2 snapshot export: `.data/cloudflare-export/community-latest.json`

Supported Cloudflare build options attached per app:

- `workers`
- `pages`
- `durable-objects`
- `queues`
- `d1`
- `r2`
- `ai-gateway`
- `agents-sdk`
