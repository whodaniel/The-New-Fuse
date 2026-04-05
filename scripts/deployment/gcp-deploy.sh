#!/bin/bash
set -e

PROJECT_ID="the-new-fuse-2025"
REGION="us-central1"
ROOT_DIR="/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse"

cd $ROOT_DIR

echo "🚀 Triggering FULL Cloud-to-Cloud Rollout..."
gcloud builds submit --config cloudbuild.yaml . --project=$PROJECT_ID

echo "✅ Rollout triggered successfully! You can monitor progress in the GCP Console."
