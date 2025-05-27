#!/bin/bash

echo "Installing specific version of yarn..."

# Install yarn globally
npm install -g yarn@4.9.1

# Verify yarn version
yarn --version

echo "Now try running 'yarn install' again."
