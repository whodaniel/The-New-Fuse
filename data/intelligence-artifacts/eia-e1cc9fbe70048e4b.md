# Executable Intelligence Artifact

**Artifact ID:** eia-e1cc9fbe70048e4b **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-08-16T19:47:06+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6509
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6509
- Title: ### 🔑 Supabase OAuth Fix & Configuration Guide
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-08-16T19:47:06+00:00

## Taxonomy of Actionability

### Procedural

- I compiled the mandatory production setup steps into
- Supabase Provider Config:
- Read(/Users/danielgoldberg/Desktop/A1-I...scripts/deployment/cloudbuild.yaml)
- Read(/Users/danielgoldberg/Desktop/A1-I...LM-Com/The-New-Fuse/Dockerfile.api)
- Edit(/Users/danielgoldberg/Desktop/A1-I...LM-Com/The-New-Fuse/Dockerfile.api)
- Bash(bash ./scripts/deployment/gcp-deploy.sh)
- ### Dockerfile & GCP Cloud Build Fix Applied
- GCP Cloud Build failed in step 77 of Dockerfile.api because
- apps/api/dist/main.js was expected without first compiling the
- TypeScript source inside the container build environment.
- Fix Applied (Dockerfile.api):
- @the-new-fuse/api-server).
- GCP Cloud Build re-submitted (gcloud builds submit --config
- scripts/deployment/cloudbuild.yaml .
- I will update you as soon as the container build and Cloud Run service
- > proceed with next tasks
- Bash(git status --porcelain)
- Bash(git add Dockerfile.api apps/tauri-desktop/src/lib/su...) (ctrl+o to
- ### Immediate Progress Summary & Next Steps
- GCP Cloud Build Submission (task-419):

### Strategic

- I have analyzed the OAuth integration across thenewfuse.com and
- Supabase Provider Config:

### Governance

- (none)

## Utility Metrics

- Freshness Decay: High
- Implementation Density: 0.282
- Verification Difficulty: Easy

## Synthesis

Artifact captures 20 procedural, 2 strategic, and 0 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.
