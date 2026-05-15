#!/bin/bash
set -e

PROJECT_ID="the-new-fuse-2025"
REGION="us-central1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${TNF_ROOT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

cd $ROOT_DIR

echo "🚀 Triggering FULL Cloud-to-Cloud Rollout..."
gcloud builds submit --config cloudbuild.yaml . --project=$PROJECT_ID

echo "✅ Rollout triggered successfully! You can monitor progress in the GCP Console."
