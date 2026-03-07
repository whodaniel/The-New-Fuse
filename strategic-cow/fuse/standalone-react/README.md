# Open Audio Spotify-Style App

Spotify-inspired music streaming frontend powered by Audius (Open Audio Protocol
ecosystem).

## Run

```bash
cd standalone-react
pnpm dev
```

Dev server runs at `http://localhost:5174`.

## Optional API key

Create `standalone-react/.env.local`:

```bash
VITE_AUDIUS_API_KEY=your_audius_api_key
```

Without a key, the app uses public Audius endpoints in read-only mode.

## Features

- Spotify-like sidebar/main/player layout
- Trending tracks from Audius
- Track search
- Stream playback from Audius track stream endpoints
- Mirror-aware artwork loading fallback for Audius image mirrors
