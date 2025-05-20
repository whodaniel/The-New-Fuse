#!/bin/bash

echo "Installing specific version of yarn..."

# Install yarn globally
npm install -g yarn@3.6.3

# Verify yarn version
yarn --version

echo "Now try running 'yarn install' again."
