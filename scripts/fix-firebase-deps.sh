#!/bin/bash
set -e

echo "🔧 Fixing Firebase dependencies..."

# Install Firebase core dependencies first
yarn add @firebase/app @firebase/app-types

# Install Firebase feature packages
yarn add \
  @firebase/analytics \
  @firebase/auth \
  @firebase/firestore \
  @firebase/functions \
  @firebase/installations \
  @firebase/messaging \
  @firebase/performance \
  @firebase/remote-config \
  @firebase/storage

# Install compat versions
yarn add \
  firebase \
  @firebase/analytics-compat \
  @firebase/app-check-compat \
  @firebase/auth-compat \
  @firebase/firestore-compat \
  @firebase/functions-compat \
  @firebase/installations-compat \
  @firebase/messaging-compat \
  @firebase/performance-compat \
  @firebase/remote-config-compat \
  @firebase/storage-compat