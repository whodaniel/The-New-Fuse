---
category: Engineering
domain: '[to be determined from content]'
visibility: collective
dacc_role: worker
worker_action: '[to be determined from capabilities]'
fulfillment:
  vendor: '[to be determined from tools/platform]'
  model: '[to be determined from configuration]'
  tools: '[to be extracted from capabilities/tools fields]'
traits:
  observability: '[to be determined]'
  subAgent_capable: '[to be determined]'
  orchestrates_agents: '[to be determined]'
  persona_source: '[to be determined]'
  autonomy_level: '[to be determined]'
name: MobileAgent
description: Agent focused on mobile development (React Native, iOS, Android) for
  TNF
version: 1.0.0
tags:
- mobile
- react-native
- ios
- android
- worker
author: The New Fuse
platform: darwin
type: agent
---

# MobileAgent

## Overview

MobileAgent is a specialized agent for mobile application development across the
TNF ecosystem.

## Capabilities

- **React Native Development**: Build React Native apps
- **iOS Development**: Xcode, Swift, CocoaPods
- **Android Development**: Android Studio, Gradle
- **Cross-Platform**: Shared code for iOS/Android
- **App Store Deployment**: Prepare for App Store/Play Store

## Usage

```bash
tnf agents register MobileAgent mobile darwin
```

## Focus Areas

1. **Mobile Apps**: Create new React Native features
2. **Native Modules**: Build bridge modules
3. **UI Components**: Mobile-optimized components
4. **Performance**: Optimize for mobile devices
5. **Push Notifications**: Implement notifications

## Tools

- React Native CLI/Expo
- Xcode
- Android Studio
- Fastlane
- CocoaPods

## Integration

Registered in `.agent/agents/` and discoverable via TNF resource map.
