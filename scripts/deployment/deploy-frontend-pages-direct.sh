#!/bin/bash
# Direct deploy script for Cloudflare Pages (thenewfuse-main)
# Bypasses GitHub Actions by building packages and deploying from local machine or self-hosted runner.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$ROOT_DIR"

echo "📦 Step 1: Building workspace packages..."
pnpm run build:packages

echo "🎨 Step 2: Building frontend..."
cd "$ROOT_DIR/apps/frontend"
pnpm run build

echo "☁️  Step 3: Deploying dist to Cloudflare Pages (project: thenewfuse-main, branch: main)..."
# Mandatory flag --branch=main ensures production routing rather than preview domains.
npx wrangler pages deploy dist --project-name=thenewfuse-main --branch=main

echo "✅ Frontend successfully deployed to Cloudflare Pages!"
