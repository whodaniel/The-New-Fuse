# NotebookLM Direct Access

This workflow exports your NotebookLM notebooks (and optional source cards)
directly from your authenticated local browser profile.

## Command

```bash
pnpm notebooklm:export
```

## Default Behavior

- Uses profile: `~/.notebooklm/browser_profile`
- Opens NotebookLM and extracts notebook list
- Visits each notebook and extracts source cards
- Writes JSON to: `data/notebooklm/notebooks-<timestamp>.json`

## Options

```bash
pnpm notebooklm:export -- --profile-dir=/path/to/profile --headless=true --limit=10 --include-sources=true --output=data/notebooklm/latest.json
```

- `--profile-dir`: Browser profile to use (must already be authenticated)
- `--headless`: Run without visible browser window
- `--limit`: Max notebooks to export
- `--include-sources`: Include source-card extraction per notebook
- `--output`: Output JSON file path

## Notes

- NotebookLM has no stable public API for this data, so this is UI-automation
  based extraction.
- If authentication fails, open NotebookLM once with the same profile and sign
  in, then rerun.
