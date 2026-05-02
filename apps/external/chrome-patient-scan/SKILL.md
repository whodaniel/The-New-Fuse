---
name: chrome-patient-scan
description: Reliable UI-based scanning of Google Chrome windows and tabs on macOS. Use when standard browser tools fail to identify all open tabs, windows, or profiles, or when you need a patient wait-time for accurate link status (e.g., detecting redirects or dead links).
---

# Chrome Patient Scan

This skill provides a reliable method for scanning all open Google Chrome windows and tabs by utilizing macOS UI automation (`System Events`) instead of the standard scripting dictionary. It ensures accuracy by physically activating windows and allowing them time to settle.

## When to Use

- Detecting dead links (404s, parked domains, redirects) that require load time.
- Standard browser tools are only "seeing" one window or profile.
- You need a "ground truth" list of every URL currently open in the user's workspace.

## Core Workflow

1. **Window Discovery**: Use `System Events` to identify all window objects drawn by the OS.
2. **Patient Activation**: Loop through windows, use `AXRaise` to focus them, and `Ctrl+Tab` to cycle tabs.
3. **Ground Truth Capture**: Use the "Address Bar Trick" (Cmd+L, Cmd+C) to capture the actual URL displayed.
4. **Wait & Verify**: Wait 3+ seconds for the page to stabilize before assessing status.

## Usage

Run the bundled Python script to perform a full scan.

```bash
# Scan ALL windows and tabs
python3 scripts/patient_scan.py

# Scan specific windows by name fragment
python3 scripts/patient_scan.py "BizSynth" "Frase"
```

## Troubleshooting

- **Permissions**: The terminal/app must have "Accessibility" permissions in macOS Settings.
- **Interruption**: Do not type or click while the script is running, as it uses simulated keystrokes.
- **Speed**: This is an intentional "slow" scan. Expect 4-5 seconds per tab.
