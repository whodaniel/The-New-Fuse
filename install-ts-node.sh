#!/bin/bash

echo "Installing ts-node directly..."
npm install --no-save ts-node@10.9.3

echo "Checking ts-node installation..."
npx ts-node --version

echo "Installation complete. Now try running 'yarn install' again."
