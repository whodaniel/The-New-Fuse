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

## Ongoing Improvement

- **Persistent Learning Log**: Maintain a `notes/` directory within this skill. After each major task, append an entry to `notes/session-log.md` detailing the approach taken, whether it was a success or a failure, and any 'lessons learned' for future agents using this skill.
- **Success Documentation**: When a complex scan or navigation task is completed successfully, capture the successful tool-call sequence or script parameters in `references/success-patterns.md` as an exemplar.
- **Instruction Refinement**: If you encounter an error caused by ambiguous instructions in this `SKILL.md`, proactively suggest a specific `/replace` operation to the user to clarify the wording for the next session.
