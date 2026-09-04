# TNF Google Cloud Build CI/CD & Desktop Distribution Manual

> **Status:** Active CI/CD and Release Policy  
> **Scope:** Replacing GitHub Actions with Google Cloud Build & Open-Source
> Artifact Distribution

---

## 1. Overview

To eliminate GitHub Actions compute minute exhaustion and billing lockouts
(especially the 10x cost multiplier on macOS runners), The New Fuse (TNF)
operates a **GCP Cloud Build + Release Distribution** pipeline:

1. **Continuous Integration (CI):** Powered by **Google Cloud Build**
   (`cloudbuild.ci.yaml`). Google Cloud Build provides **120 free build-minutes
   per day** (~3,600 minutes/month) on Linux high-CPU instances
   (`E2_HIGHCPU_8`), running tests, typechecks, and protocol gates.
2. **Desktop Artifacts (DMG):** Decoupled from dynamic per-commit builds.
   Production DMGs are built locally or on self-hosted capacity and distributed
   via **GitHub Releases** and **Cloudflare R2** with zero hosting and zero
   egress fees.

---

## 2. Google Cloud Build CI Pipeline

The CI pipeline is defined in
[`cloudbuild.ci.yaml`](file:///Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/cloudbuild.ci.yaml):

```text
Google Cloud Build (E2_HIGHCPU_8)
  ├── Step 1: Install dependencies & build packages (pnpm install & build:packages)
  ├── Step 2: Typecheck critical surfaces (API server & Frontend App tsc)
  ├── Step 3: Run Core unit tests (Relay Core & TNF CLI test suites)
  └── Step 4: Validate Protocol Schemas & Security Gates (privacy-guard & schema check)
```

### Running Cloud Build CI Manually

To trigger a full CI test run on Google Cloud infrastructure:

```bash
pnpm run ci:gcp
# Equivalent to:
gcloud builds submit --config cloudbuild.ci.yaml . --project=the-new-fuse-2025
```

### Connecting Automatic GitHub Triggers in GCP

To have Google Cloud Build automatically test pull requests and pushes and
report green checkmarks to GitHub:

1. Navigate to
   [GCP Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers?project=the-new-fuse-2025).
2. Click **Connect Repository** → Select **GitHub (Cloud Build GitHub App)**.
3. Select `whodaniel/tnf-monorepo`.
4. Create a trigger:
   - **Event:** Pull request / Push to a branch (`^main$`)
   - **Configuration:** Cloud Build configuration file: `cloudbuild.ci.yaml`
5. On every PR, Cloud Build will automatically validate code on Google's cloud
   runners and report status to the PR.

---

## 3. Desktop DMG Packaging & Distribution

### Why DMGs Are Not Built on Every PR

Building a macOS DMG dynamically on every commit is inefficient:

- macOS runners take 15–20 minutes and consume huge resources.
- Pull requests rarely alter native Rust desktop wrappers.
- Committing compiled binaries into `.git` bloats repository size.

### Open-Source Distribution Standard

Pre-built binaries are distributed as **Release Assets**:

1. **GitHub Releases:** Standalone DMGs are uploaded to GitHub Releases
   (`https://github.com/whodaniel/tnf-monorepo/releases`). GitHub provides
   unlimited hosting and global CDN downloads for public and open-source release
   assets at $0 cost.
2. **Cloudflare R2 (Optional CDN):** DMGs can be mirrored to Cloudflare R2
   buckets for vanity download URLs (e.g.
   `https://downloads.thenewfuse.com/TheNewFuse.dmg`) with zero egress bandwidth
   fees.

### Packaging & Releasing a New DMG

To build and publish the latest DMG:

```bash
# Automated packaging and GitHub Release upload
pnpm run release:dmg
```

This executes
[`scripts/packaging/distribute-desktop-dmg.sh`](file:///Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/scripts/packaging/distribute-desktop-dmg.sh),
which:

1. Checks for an existing DMG bundle or compiles one via
   [`scripts/packaging/build-tauri-dmg.cjs`](file:///Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/scripts/packaging/build-tauri-dmg.cjs).
2. Reads the app version from `apps/tauri-desktop/package.json`.
3. Creates or updates the corresponding release tag (e.g., `v4.1.0-desktop`) on
   GitHub.
4. Uploads the `.dmg` asset and prints the permanent download URL.

---

## 4. Full Command Reference

| Command                 | Action                                                        |
| :---------------------- | :------------------------------------------------------------ |
| `pnpm run ci:gcp`       | Runs full monorepo CI on Google Cloud Build (`E2_HIGHCPU_8`). |
| `pnpm run deploy:gcp`   | Builds and deploys backend services to GCP Cloud Run.         |
| `pnpm run deploy:pages` | Builds and deploys frontend to Cloudflare Pages.              |
| `pnpm run build:dmg`    | Builds the macOS Tauri desktop DMG on your local Mac.         |
| `pnpm run release:dmg`  | Builds and distributes the DMG to GitHub Releases.            |
| `pnpm run setup:runner` | Configures a free self-hosted GitHub Actions runner.          |
