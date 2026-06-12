#!/bin/bash
export PATH="/Users/danielgoldberg/.hermes/node/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export A2A_SECRET_KEY="default-secret"
export AGENT_ID="tnf-gemini-redis-wrapper"

# Source environment
source /Users/danielgoldberg/.tnf-claude-env

cd /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse
exec node scripts/gemini-redis-wrapper.cjs
