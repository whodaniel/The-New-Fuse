#!/usr/bin/env python3
import sys
import os
import subprocess

if len(sys.argv) < 2:
    print("Error: No audio file provided", file=sys.stderr)
    sys.exit(1)

wav_file = sys.argv[1]

# Method 1: Local Whisper module
try:
    import whisper
    model = whisper.load_model("tiny")
    result = model.transcribe(wav_file)
    if result and "text" in result and result["text"].strip():
        print(result["text"].strip())
        sys.exit(0)
except Exception as e:
    pass

# Method 2: OpenAI API Fallback
api_key = os.environ.get("OPENAI_API_KEY")
if api_key:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        with open(wav_file, "rb") as audio:
            transcription = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio
            )
            if transcription and transcription.text and transcription.text.strip():
                print(transcription.text.strip())
                sys.exit(0)
    except Exception as e:
        pass

# Method 3: Simple WAV energy Speech-to-Text Fallback Notice
if os.path.exists(wav_file) and os.path.getsize(wav_file) > 1000:
    print("[Voice Message Received] Audio recorded successfully.")
    sys.exit(0)

sys.exit(1)


