#!/bin/bash

# Clean the current installation
bun clean

# Install core Firebase dependencies first
bun add @firebase/app@^0.11.2
bun add @firebase/app-types@^0.9.3
bun add @firebase/app-compat@^0.2.0

# Install Firebase feature packages
bun add @firebase/analytics@^0.10.12 \
  @firebase/auth@^1.9.1 \
  @firebase/firestore@^4.7.9 \
  @firebase/functions@^0.12.3

# Install Firebase compat packages
bun add @firebase/analytics-compat@^0.2.18 \
  @firebase/auth-compat@^0.2.0 \
  @firebase/firestore-compat@^0.2.0 \
  @firebase/functions-compat@^0.2.0

# Install React and its dependencies
bun add react@^18.2.0 react-dom@^18.2.0
bun add -D @types/react@^18.2.0 @types/react-dom@^18.2.0

# Install Chakra UI dependencies
bun add @chakra-ui/react @emotion/react @emotion/styled framer-motion

# Install other required dependencies
bun add -D @types/fs-extra @types/winston
bun add reflect-metadata@^0.2.2

# Install workspace packages
bun --filter @the-new-fuse/core run add react@^18.2.0 react-dom@^18.2.0
bun --filter @the-new-fuse/types run add react@^18.2.0 react-dom@^18.2.0
bun --filter @the-new-fuse/feature-tracker run add react@^18.2.0 react-dom@^18.2.0

# Regenerate lockfile
bun install
