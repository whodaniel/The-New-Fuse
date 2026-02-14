# TNF Copilot CLI

A secure, standalone tool part of "The New Fuse" to analyze context using local
OpenClaw agents.

## Features

- **Security First**: Automatically captures, processes, and immediately deletes
  screenshots.
- **Privacy**: Runs locally against `http://127.0.0.1:18789`. No external cloud
  leakage unless configured.
- **Flexible**: Configure update interval, directives (prompts), and API
  endpoints via CLI flags.

## Installation

Run the setup script:

```bash
bash scripts/install-copilot-cli.sh
```

This adds the `tnf-copilot` alias to your shell.

## Usage

### Start Continuous Mode (Default Loop)

Monitor context every 30 seconds.

```bash
tnf-copilot start
```

### Single Snapshot

Take one snapshot and stop.

```bash
tnf-copilot once
```

### Customization

Override defaults via flags:

```bash
tnf-copilot start --interval 60 --prompt "Find SQL vulnerabilities in my code" --endpoint "http://127.0.0.1:18789/v1/chat/completions"
```

### API Endpoint Configuration

By default, the tool assumes OpenClaw is running on
`http://127.0.0.1:18789/v1/chat/completions`. If your setup differs (e.g.,
different port or path), update `tools/copilot-cli.js` or pass the `--endpoint`
argument.

Currently supported endpoints:

- `http://127.0.0.1:18789/v1/chat/completions` (OpenClaw Standard)
- `http://127.0.0.1:18789/openai/v1/chat/completions` (OpenClaw / Kilo Gateway)

## Troubleshooting

If you see `API Error 405` or `404`, check your OpenClaw Gateway configuration.
Ensure the API is enabled and accessible via POST.
