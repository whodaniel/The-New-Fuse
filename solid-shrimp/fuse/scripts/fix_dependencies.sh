#!/bin/bash

set -e

echo "Installing missing dependencies..."
yarn add rimraf bcryptjs @types/bcryptjs
yarn add @types/ws --dev

echo "Fixing TypeScript files..."
