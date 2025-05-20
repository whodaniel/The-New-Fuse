#!/bin/bash

# Exit on error
set -e

echo "Cleaning Yarn cache..."
yarn cache clean

echo "Removing Yarn cache directory..."
rm -rf .yarn/cache

echo "Installing dependencies..."
yarn install

echo "Building Chrome extension..."
yarn workspace chrome-extension build

echo "Done!"
