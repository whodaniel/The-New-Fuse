#!/bin/bash
# OpenClaw + Antigravity Integration Setup Script
# Run this script interactively to complete the OAuth authentication

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║       OpenClaw + Antigravity Integration Setup                     ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

cd ~/Desktop/A1-Inter-LLM-Com/The-New-Fuse/openclaw-runtime

echo "Step 1: Authenticating with Google Gemini CLI OAuth..."
echo "A browser window will open for you to sign in with your Google account."
echo ""

pnpm openclaw models auth login --provider google-gemini-cli --set-default

echo ""
echo "Step 2: Verifying model access..."
pnpm openclaw models list

echo ""
echo "Step 3: Testing agent..."
pnpm openclaw agent --agent main --message "Hello! Please confirm you are working. State your model name." --local

echo ""
echo "Step 4: Running status check..."
pnpm openclaw status

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║       Setup Complete!                                               ║"
echo "║       Dashboard: http://127.0.0.1:18789/                           ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
