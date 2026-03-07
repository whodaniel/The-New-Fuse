#!/bin/bash
echo "Building essential packages first..."
yarn build:types
yarn build:utils
yarn build:core
yarn build:ui
echo "Building feature packages..."
yarn build:feature-tracker
yarn build:feature-suggestions
echo "Build completed without database migrations!"
