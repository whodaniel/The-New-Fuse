#!/bin/bash

# Clean existing installations
yarn clean

# Fix React-related peer dependencies
yarn add react@18.2.0 react-dom@18.2.0
yarn add -D @types/react@18.2.0 @types/react-dom@18.2.0

# Install core Firebase dependencies first
yarn add @firebase/app@0.11.2
yarn add @firebase/app-types@0.9.3
yarn add @firebase/app-compat@0.2.0

# Fix Firebase feature packages
yarn add @firebase/analytics@0.10.12
yarn add @firebase/auth@1.9.1
yarn add @firebase/firestore@4.7.9
yarn add @firebase/functions@0.12.3
yarn add @firebase/storage@0.13.7
yarn add @firebase/installations@0.6.13
yarn add @firebase/messaging@0.12.17
yarn add @firebase/performance@0.7.1
yarn add @firebase/remote-config@0.6.0

# Fix compat packages with explicit app dependency
# Each compat package needs @firebase/app as a peer dependency
yarn add @firebase/app@0.11.2 @firebase/app-types@0.9.3
yarn add @firebase/analytics-compat@0.2.18
yarn add @firebase/app@0.11.2 @firebase/app-types@0.9.3
yarn add @firebase/app-check-compat@0.2.17
yarn add @firebase/app@0.11.2 @firebase/app-types@0.9.3
yarn add @firebase/auth-compat@0.2.24
yarn add @firebase/app@0.11.2 @firebase/app-types@0.9.3
yarn add @firebase/firestore-compat@0.2.3
yarn add @firebase/app@0.11.2 @firebase/app-types@0.9.3
yarn add @firebase/functions-compat@0.2.8
yarn add @firebase/app@0.11.2 @firebase/app-types@0.9.3
yarn add @firebase/installations-compat@0.2.13
yarn add @firebase/app@0.11.2 @firebase/app-types@0.9.3
yarn add @firebase/messaging-compat@0.2.17
yarn add @firebase/app@0.11.2 @firebase/app-types@0.9.3
yarn add @firebase/performance-compat@0.2.14
yarn add @firebase/app@0.11.2 @firebase/app-types@0.9.3
yarn add @firebase/remote-config-compat@0.2.13
yarn add @firebase/app@0.11.2 @firebase/app-types@0.9.3
yarn add @firebase/storage-compat@0.3.17

# Fix Inversify and reflect-metadata
# @inversifyjs/core needs reflect-metadata as a peer dependency
yarn add reflect-metadata@0.2.2
yarn add @inversifyjs/core@1.3.5

# Fix Chakra UI peer dependencies
yarn add @chakra-ui/react

# Clean and reinstall
yarn cache clean
yarn install