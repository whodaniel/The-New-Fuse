# LLM Arena Intel Collector Protocol

## Overview
Collects LLM arena rankings, news/sentiment, and NVIDIA NGC health probes on a 4-hour cadence. Outputs structured JSON to `data/llm-intel/`.

## Schedule
- **Cron**: `0 */4 * * *` (every 4 hours, UTC)
- **Registry ID**: `tnf-llm-arena-intel-collector`
- **Category**: `llm_intelligence`
- **Owner**: `llm-intel-collector` agent / `super-admin`

## Data Sources

### Arena Rankings
| Source | URL | Method |
|--------|-----|--------|
| LM Arena (Chatbot Arena) | `https://lmarena.ai/` | HTML scrape |
| LM Arena Vision | `https://lmarena.ai/?leaderboard` | HTML scrape |
| Agent Arena | `https://agent-arena.ai/leaderboard` | HTML scrape |
| Artificial Analysis | `https://artificialanalysis.ai/leaderboards/text` | HTML scrape |
| HuggingFace Open LLM | `https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard` | HTML scrape |
| Aider Leaderboard | `https://aider.chat/docs/leaderboards/` | HTML scrape |
| SWE-bench Verified | `https://www.swebench.com/verified.html` | HTML scrape |
| SEED Bench | `https://huggingface.co/spaces/Seed4487/SEED-Bench` | HTML scrape |

### News / Sentiment
| Source | URL | Type |
|--------|-----|------|
| r/LocalLLaMA | `https://www.reddit.com/r/LocalLLaMA/new.json` | JSON feed |
| HuggingFace Blog | `https://huggingface.co/blog/feed.xml` | RSS |
| OpenAI Blog | `https://openai.com/blog/rss.xml` | RSS |
| Anthropic News | `https://www.anthropic.com/news/rss.xml` | RSS |

### NVIDIA NGC Health Probes
- All 45 models in the canonical model list
- API endpoint: `https://integrate.api.nvidia.com/v1/chat/completions`
- Auth: `~/.hermes/.env` → `NVIDIA_NIM_API_KEY`
- Timeout: 15s per model
- Probe: minimal chat completion request

## Output Schema (`tnf/llm-arena-intel/0.1`)

```
data/llm-intel/
├── arena-intel-latest.json    # Current snapshot
├── history/
│   ├── arena-intel-2026-05-04.json
│   └── ...                    # Rolling 30-day archive
```

### arena-intel-latest.json
```json
{
  "schema": "tnf/llm-arena-intel/0.1",
  "collectedAt": "2026-05-04T12:00:00Z",
  "arenaData": [{ "source": "lm-arena", "url": "...", "rankings": [...] }],
  "newsData": [{ "title": "...", "url": "...", "source": "...", "sentiment": "..." }],
  "nvidiaHealth": [{ "model": "...", "status": "live|slow|eol|error", "httpStatus": 200, "latencyMs": 850 }],
  "summary": { "arenaSourcesOk": 6, "totalArticles": 3, "nvidiaLive": 22, "nvidiaSlow": 10, "nvidiaEol": 3 }
}
```

## Error Handling
- Arena scraping failures: logged, source marked as error, other sources continue
- NVIDIA API timeouts (>15s): model marked `slow`
- NVIDIA API 404: model marked `error`
- NVIDIA API 401: entire NVIDIA probe skipped, error logged
- Network failures: graceful degradation, partial data written

## Run Commands
```bash
# Manual run
pnpm tnf:llm:collect

# Via cron runner
node scripts/protocols/run-chronological-process.cjs --process-id tnf-llm-arena-intel-collector
```
