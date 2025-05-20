#!/bin/bash

# Clean existing installations
yarn clean

# Install core dependencies
yarn add react@^18.2.0 react-dom@^18.2.0 @types/react@^18.2.0 @types/react-dom@^18.2.0
yarn add reflect-metadata@^0.2.2 rxjs@^7.8.2

# Install Firebase dependencies with consistent versions
yarn add @firebase/app@^0.11.2 @firebase/app-types@^0.9.3 @firebase/app-compat@^0.2.0

# Install Firebase feature packages
yarn add @firebase/analytics@^0.10.12 @firebase/auth@^1.9.1 @firebase/firestore@^4.7.9 \
  @firebase/functions@^0.12.3 @firebase/installations@^0.6.13 @firebase/messaging@^0.12.17 \
  @firebase/performance@^0.7.1 @firebase/remote-config@^0.6.0 @firebase/storage@^0.13.7

# Install Firebase compat packages with explicit app dependency
yarn add @firebase/analytics-compat@^0.2.18
yarn add @firebase/app@^0.11.2 @firebase/app-types@^0.9.3
yarn add @firebase/auth-compat@^0.2.0
yarn add @firebase/firestore-compat@^0.2.0
yarn add @firebase/functions-compat@^0.2.0
yarn add @firebase/installations-compat@^0.2.13
yarn add @firebase/messaging-compat@^0.2.17
yarn add @firebase/performance-compat@^0.2.14
yarn add @firebase/remote-config-compat@^0.2.13
yarn add @firebase/storage-compat@^0.3.17

# Fix Chakra UI peer dependencies
yarn add @chakra-ui/react

# Install other core dependencies
yarn add express@^4.21.2 express-rate-limit@^7.5.0
yarn add vite@^6.2.1 @vitejs/plugin-react@^4.3.4
yarn add eslint@^9.22.0 @typescript-eslint/eslint-plugin@^8.26.1 @typescript-eslint/parser@^8.26.1

# Fix InversifyJS peer dependency
yarn add @inversifyjs/core reflect-metadata@^0.2.2

# Add React to packages that need it
yarn workspace @the-new-fuse/database add react@^18.2.0 react-dom@^18.2.0
yarn workspace @the-new-fuse/ui add react@^18.2.0 react-dom@^18.2.0
yarn workspace @the-new-fuse/shared add react@^18.2.0 react-dom@^18.2.0

# Add React types to packages
yarn workspace @the-new-fuse/database add -D @types/react@^18.2.0 @types/react-dom@^18.2.0
yarn workspace @the-new-fuse/ui add -D @types/react@^18.2.0 @types/react-dom@^18.2.0
yarn workspace @the-new-fuse/shared add -D @types/react@^18.2.0 @types/react-dom@^18.2.0

# Regenerate lockfile
yarn install