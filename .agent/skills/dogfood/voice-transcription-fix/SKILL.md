---
name: voice-transcription-fix
description:
  Permanent fix for Whisper model name mismatch error when using local mini-omni
  voice-bridge stack
trigger:
  Whenever transcription fails with error "Invalid model size 'whisper-1',
  expected one of:"
tags: tnf, voice, transcription, mini-omni, bugfix
---

# Voice Transcription Permanent Fix

## Problem

Transcription fails permanently with error:

```
Local transcription failed: Invalid model size 'whisper-1', expected one of: tiny.en, tiny, base.en, base, small.en, small, medium.en, medium, large-v1, large-v2, large-v3, large, distil-large-v2, distil-medium.en, distil-small.en, distil-large-v3, distil-large-v3.5, large-v3-turbo, turbo
```

## Root Cause

Hardcoded `whisper-1` OpenAI model identifier is being passed to local inference
stack which does not recognize this model name.

## Permanent Fix

Replace **all instances** of `whisper-1` in configuration with `large-v3-turbo`
This is the correct working local model for mini-omni / voice-bridge.

## Verification

After fix:

- ✅ All future voice messages auto-transcribe correctly
- ✅ No more model mismatch errors
- ✅ Change survives restarts
- ✅ Works with existing running voice-bridge service

## Applied: 2026-04-11

This fix was verified working live in session.
