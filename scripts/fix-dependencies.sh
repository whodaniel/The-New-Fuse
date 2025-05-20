#!/bin/bash

# Clean the current installation
yarn clean

# Install core Firebase dependencies first
yarn add @firebase/app@^0.11.2
yarn add @firebase/app-types@^0.9.3
yarn add @firebase/app-compat@^0.2.0

# Install Firebase feature packages
yarn add @firebase/analytics@^0.10.12 \
  @firebase/auth@^1.9.1 \
  @firebase/firestore@^4.7.9 \
  @firebase/functions@^0.12.3

# Install Firebase compat packages
yarn add @firebase/analytics-compat@^0.2.18 \
  @firebase/auth-compat@^0.2.0 \
  @firebase/firestore-compat@^0.2.0 \
  @firebase/functions-compat@^0.2.0

# Install React and its dependencies
yarn add react@^18.2.0 react-dom@^18.2.0
yarn add -D @types/react@^18.2.0 @types/react-dom@^18.2.0

# Install Chakra UI dependencies
yarn add @chakra-ui/react @emotion/react @emotion/styled framer-motion

# Install other required dependencies
yarn add -D @types/fs-extra @types/winston
yarn add reflect-metadata@^0.2.2

# Install workspace packages
yarn workspace @the-new-fuse/core add react@^18.2.0 react-dom@^18.2.0
yarn workspace @the-new-fuse/types add react@^18.2.0 react-dom@^18.2.0
yarn workspace @the-new-fuse/feature-tracker add react@^18.2.0 react-dom@^18.2.0

# Regenerate lockfile
yarn install
