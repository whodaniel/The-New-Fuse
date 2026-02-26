import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASES = [
  import.meta.env.VITE_AUDIUS_BASE_URL,
  'https://discoveryprovider.audius.co/v1/',
  'https://api.audius.co/v1/',
].filter((value, index, list) => value && list.indexOf(value) === index);
const APP_NAME = 'tnf-open-audio-spotify';
const API_KEY = import.meta.env.VITE_AUDIUS_API_KEY;
let lastWorkingApiBase = API_BASES[0];
const FALLBACK_TRACKS = [
  {
    id: 'demo-1',
    title: 'Open Audio Demo 01',
    duration: 372,
    play_count: 18240,
    user: { name: 'Demo Station' },
    streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'demo-2',
    title: 'Open Audio Demo 02',
    duration: 402,
    play_count: 9652,
    user: { name: 'Demo Station' },
    streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 'demo-3',
    title: 'Open Audio Demo 03',
    duration: 411,
    play_count: 7511,
    user: { name: 'Demo Station' },
    streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
];

function withQuery(path, params = {}, apiBase = lastWorkingApiBase) {
  const normalizedPath = String(path).replace(/^\/+/, '');
  const normalizedBase = apiBase.endsWith('/') ? apiBase : `${apiBase}/`;
  const url = new URL(normalizedPath, normalizedBase);
  Object.entries({ app_name: APP_NAME, ...params }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function fetchAudius(path, params = {}) {
  const headers = API_KEY ? { 'x-api-key': API_KEY } : {};
  const candidates = [
    lastWorkingApiBase,
    ...API_BASES.filter((base) => base !== lastWorkingApiBase),
  ];
  const failures = [];

  for (const apiBase of candidates) {
    const response = await fetch(withQuery(path, params, apiBase), { headers });
    if (!response.ok) {
      failures.push(`${apiBase} => ${response.status}`);
      continue;
    }

    const json = await response.json();
    lastWorkingApiBase = apiBase;
    return json?.data ?? [];
  }

  throw new Error(`Audius request failed (${failures.join('; ')})`);
}

function createStreamUrl(trackId) {
  if (typeof trackId === 'string' && trackId.startsWith('https://')) {
    return trackId;
  }
  const normalizedBase = lastWorkingApiBase.endsWith('/')
    ? lastWorkingApiBase
    : `${lastWorkingApiBase}/`;
  const url = new URL(`tracks/${trackId}/stream`, normalizedBase);
  url.searchParams.set('app_name', APP_NAME);
  if (API_KEY) {
    url.searchParams.set('api_key', API_KEY);
  }
  return url.toString();
}

function formatDuration(seconds = 0) {
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function getImageCandidates(artwork) {
  const preferred =
    artwork?.['1000x1000'] || artwork?.['480x480'] || artwork?.['150x150'] || artwork?.url || '';
  if (!preferred) return [];

  const candidates = [preferred];
  const mirrors = Array.isArray(artwork?.mirrors) ? artwork.mirrors : [];

  mirrors.forEach((mirror) => {
    if (!mirror) return;
    try {
      const preferredUrl = new URL(preferred);
      const mirrorUrl = new URL(mirror);
      preferredUrl.protocol = mirrorUrl.protocol;
      preferredUrl.host = mirrorUrl.host;
      candidates.push(preferredUrl.toString());
    } catch {
      candidates.push(mirror);
    }
  });

  return [...new Set(candidates)];
}

function MirrorImage({ artwork, alt, className }) {
  const candidates = useMemo(() => getImageCandidates(artwork), [artwork]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [candidates.length, alt]);

  if (!candidates.length) {
    return <div className={`${className} artwork-fallback`} aria-hidden="true" />;
  }

  return (
    <img
      className={className}
      src={candidates[Math.min(index, candidates.length - 1)]}
      alt={alt}
      loading="lazy"
      onError={() => {
        setIndex((current) => (current < candidates.length - 1 ? current + 1 : current));
      }}
    />
  );
}

function App() {
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [activeTrack, setActiveTrack] = useState(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadHome() {
      setIsLoading(true);
      setError('');
      try {
        const [topTracks, topPlaylists] = await Promise.all([
          fetchAudius('tracks/trending', { limit: 18 }),
          fetchAudius('playlists/trending', { limit: 8 }).catch(() => []),
        ]);
        setTracks(topTracks);
        setPlaylists(topPlaylists);
        setActiveTrack(topTracks[0] ?? null);
      } catch (e) {
        setError((e.message || 'Failed to load Audius catalog.') + ' Showing demo tracks instead.');
        setTracks(FALLBACK_TRACKS);
        setPlaylists([]);
        setActiveTrack(FALLBACK_TRACKS[0] ?? null);
      } finally {
        setIsLoading(false);
      }
    }
    loadHome();
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    if (!search.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const results = await fetchAudius('tracks/search', { query: search.trim(), limit: 20 });
      setTracks(results);
      if (results.length) {
        setActiveTrack(results[0]);
      }
    } catch (e) {
      const fallbackMatches = FALLBACK_TRACKS.filter(
        (track) =>
          track.title.toLowerCase().includes(search.trim().toLowerCase()) ||
          (track.user?.name || '').toLowerCase().includes(search.trim().toLowerCase())
      );
      setTracks(fallbackMatches);
      setActiveTrack(fallbackMatches[0] ?? null);
      setError((e.message || 'Search failed.') + ' Showing demo matches instead.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="ambient-glow ambient-glow-left" />
      <div className="ambient-glow ambient-glow-right" />
      <aside className="sidebar">
        <h1 className="brand">Open Audio</h1>
        <p className="brand-subtitle">Spotify-style client on Audius + OAP</p>
        <nav className="nav-list">
          <button className="nav-item nav-item-active">Home</button>
          <button className="nav-item">Discover</button>
          <button className="nav-item">Library</button>
          <button className="nav-item">Liked Tracks</button>
        </nav>
      </aside>

      <main className="main-view">
        <header className="topbar">
          <form className="search-wrap" onSubmit={handleSearch}>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tracks on Audius"
              aria-label="Search tracks"
            />
          </form>
          <span className="status-pill">{API_KEY ? 'API Key Connected' : 'Public Mode'}</span>
        </header>

        {error ? <p className="error-banner">{error}</p> : null}

        <section className="section">
          <h2>Trending Tracks</h2>
          {isLoading && !tracks.length ? <p className="loading">Loading tracks...</p> : null}
          <div className="track-grid">
            {tracks.map((track) => (
              <article
                className={`track-card ${activeTrack?.id === track.id ? 'track-card-active' : ''}`}
                key={track.id}
                onClick={() => setActiveTrack(track)}
                role="button"
                tabIndex={0}
                onKeyUp={(event) => {
                  if (event.key === 'Enter') setActiveTrack(track);
                }}
              >
                <MirrorImage artwork={track.artwork} alt={track.title} className="track-artwork" />
                <h3>{track.title}</h3>
                <p>{track.user?.name || 'Unknown Artist'}</p>
                <div className="track-meta">
                  <span>{formatDuration(track.duration)}</span>
                  <span>{(track.play_count || 0).toLocaleString()} plays</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Featured Playlists</h2>
          <div className="playlist-row">
            {playlists.map((playlist) => (
              <article className="playlist-card" key={playlist.id}>
                <MirrorImage
                  artwork={playlist.artwork || playlist.playlist_contents?.[0]?.artwork}
                  alt={playlist.playlist_name || 'Playlist'}
                  className="playlist-artwork"
                />
                <h3>{playlist.playlist_name || 'Untitled Playlist'}</h3>
                <p>{playlist.user?.name || 'Audius Curator'}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="player">
        <div className="player-track">
          {activeTrack ? (
            <>
              <MirrorImage
                artwork={activeTrack.artwork}
                alt={activeTrack.title}
                className="player-artwork"
              />
              <div>
                <strong>{activeTrack.title}</strong>
                <p>{activeTrack.user?.name || 'Unknown Artist'}</p>
              </div>
            </>
          ) : (
            <p>Select a track to play</p>
          )}
        </div>
        <div className="player-controls">
          {activeTrack ? (
            <audio
              controls
              preload="none"
              src={activeTrack.streamUrl || createStreamUrl(activeTrack.id)}
            />
          ) : (
            <div className="player-placeholder" />
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;
