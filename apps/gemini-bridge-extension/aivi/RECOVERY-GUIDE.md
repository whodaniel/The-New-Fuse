# 🦅 Phoenix Protocol: Video Processing Recovery Guide

## Overview

We experienced a significant system state loss where `VideoHarvester.ts` and
`LocalAnalyst.ts` were deleted. Instead of attempting a messy file recovery, we
adopted the **Phoenix Strategy**: we consolidated the best features of the lost
files into `TranscriptProcessorV2.ts`, making it the single, resilient engine
for the entire pipeline.

## The New Phased Architecture

To ensure data integrity and process strictness (completing Phase 1 before Phase
2), we have updated the processor to support **Atomic Phases** and strict
dependency handling.

### Phase 1: Harvesting (Metadata & Transcript)

- **Goal:** Secure the raw data.
- **Mechanism:** `video.metadata` + `video.transcript`.
- **Fallback:** If simple scraping fails, `yt-dlp` (command line tool) is
  automatically invoked to ensure we get the transcript.
- **Execution:** `... --phase=transcript`

### Phase 2: AI Analysis

- **Goal:** Extract insights and identify visual gaps.
- **Mechanism:** `video.analysis`.
- **Dependency:** Strictly requires Phase 1 completion.
- **Execution:** `... --phase=analysis` (Default)

### Phase 3: Visual Gap Filling

- **Goal:** Analyze specific moments where the Audio/Transcript is insufficient.
- **Mechanism:** `VisualAnalyst` (Scanning `needs_visual` status).

## Recovery & Integrity Steps

If the system crashes or behaves unexpectedly, run the following:

1.  **Status Report:**

    ```bash
    npx ts-node src/GenerateStatusReport.ts
    ```

    This tells you exactly how many videos are Pending vs. Complete vs. Needs
    Visual Review.

2.  **Library Sync:** If you manually processed videos in AI Studio, sync them
    back:
    ```bash
    npx ts-node src/LibraryImporter.ts
    ```

## Executing the Workflow

### Step 1: Secure Transcripts (Safest First Step)

Run this command to ONLY fetch metadata and transcripts. Low risk of API bans or
quota limits.

```bash
./scripts/run-v2.sh --start=633 --end=1 --phase=transcript
```

### Step 2: Analyze Data

Once Step 1 is stable/done, run AI Analysis on the collected transcripts.

```bash
./scripts/run-v2.sh --start=633 --end=1 --phase=analysis
```

### Automatic Mode

If you want to just "let it rip" (do everything per video), simply run:

```bash
./scripts/run-v2.sh --start=633 --end=1
```

## Resilience Features

- **Persistent Chrome Profile:** No manual authentication needed.
- **yt-dlp Fallback:** We don't die on UI changes.
- **State Saving:** Progress is saved JSON-Atomically after every step.
