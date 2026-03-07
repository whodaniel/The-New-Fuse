#!/bin/bash

echo "Building @the-new-fuse/hooks package..."
cd /path/to/Desktop/A1-Inter-LLM-Com/The\ New\ Fuse/packages/hooks
yarn tsc --skipLibCheck

if [ $? -eq 0 ]; then
  echo "✅ Build succeeded!"
else
  echo "❌ Build failed with error code $?"
fi