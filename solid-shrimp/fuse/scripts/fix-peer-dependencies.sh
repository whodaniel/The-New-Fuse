#!/bin/bash

# Clean existing installations
pnpm clean

# Fix React-related peer dependencies
pnpm add react@18.2.0 react-dom@18.2.0
pnpm add -D @types/react@18.2.0 @types/react-dom@18.2.0

# Install core Firebase dependencies first
pnpm add @firebase/app@0.11.2
pnpm add @firebase/app-types@0.9.3
pnpm add @firebase/app-compat@0.2.0

# Fix Firebase feature packages
pnpm add @firebase/analytics@0.10.12
pnpm add @firebase/auth@1.9.1
pnpm add @firebase/firestore@4.7.9
pnpm add @firebase/functions@0.12.3
pnpm add @firebase/storage@0.13.7
pnpm add @firebase/installations@0.6.13
pnpm add @firebase/messaging@0.12.17
pnpm add @firebase/performance@0.7.1
pnpm add @firebase/remote-config@0.6.0

# Fix compat packages with explicit app dependency
# Each compat package needs @firebase/app as a peer dependency
pnpm add @firebase/app@0.11.2 @firebase/app-types@0.9.3
pnpm add @firebase/analytics-compat@0.2.18
pnpm add @firebase/app@0.11.2 @firebase/app-types@0.9.3
pnpm add @firebase/app-check-compat@0.2.17
pnpm add @firebase/app@0.11.2 @firebase/app-types@0.9.3
pnpm add @firebase/auth-compat@0.2.24
pnpm add @firebase/app@0.11.2 @firebase/app-types@0.9.3
pnpm add @firebase/firestore-compat@0.2.3
pnpm add @firebase/app@0.11.2 @firebase/app-types@0.9.3
pnpm add @firebase/functions-compat@0.2.8
pnpm add @firebase/app@0.11.2 @firebase/app-types@0.9.3
pnpm add @firebase/installations-compat@0.2.13
pnpm add @firebase/app@0.11.2 @firebase/app-types@0.9.3
pnpm add @firebase/messaging-compat@0.2.17
pnpm add @firebase/app@0.11.2 @firebase/app-types@0.9.3
pnpm add @firebase/performance-compat@0.2.14
pnpm add @firebase/app@0.11.2 @firebase/app-types@0.9.3
pnpm add @firebase/remote-config-compat@0.2.13
pnpm add @firebase/app@0.11.2 @firebase/app-types@0.9.3
pnpm add @firebase/storage-compat@0.3.17

# Fix Inversify and reflect-metadata
# @inversifyjs/core needs reflect-metadata as a peer dependency
pnpm add reflect-metadata@0.2.2
pnpm add @inversifyjs/core@1.3.5

# Fix Chakra UI peer dependencies
pnpm add @chakra-ui/react

# Clean and reinstall
pnpm store prune
pnpm install