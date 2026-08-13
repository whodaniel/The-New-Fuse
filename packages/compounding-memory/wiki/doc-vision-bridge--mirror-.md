# Verified Doc: Vision Bridge (Mirror)

**Category:** verified-documentation **Agent:** AGENT-DOC-ASSIMILATOR
**Timestamp:** 1776101187.9048843

## Content

# TNF Vision Bridge (iPhone/iPad Mirroring)

The TNF Vision Bridge is a high-performance AirPlay receiver and screen-capture
utility designed to allow AI agents within the TNF ecosystem to "see" and
interact with mobile devices in real-time. This provides a bridge between
proprietary mobile operating systems and open-source automation frameworks.

## Features

- **High-Performance Mirroring:** Uses `uxplay` (AirPlay receiver) to display a
  mobile screen in a window.
- **AI-Ready Vision Processing:** Automatically crops screenshots to the mobile
  window and overlays a coordinate grid for better LLM spatial reasoning.
- **Dynamic Interaction:** Provides coordinate mapping to translate AI "click"
  commands from the vision input back to the physical screen.
- **Low-Latency Architecture:** Optimized for vision tasks with adjustable frame
  rates and resolution settings.

## Prerequisites

1. **System Dependencies:** `uxplay` must be installed.
2. **Python Dependencies:** `pyautogui`, `opencv-python`, and `numpy` are
   required.

## Quick Setup

Run the following command to automatically install all dependencies:

```bash
tnf mirror setup
```

## Usage Instructions

### 1. Launch the Receiver

Start the mirroring server via the TNF CLI:

```bash
tnf mirror start
```

### 2. Connect Your Device

On your mobile device, open the **Control Center** -> **Screen Mirroring** and
select **"TNF-Mirror-Receiver"**.

### 3. Calibration (One-Time)

The vision system needs to know which window to track.

1. While mirroring is active, take a small screenshot of the **window title
   bar** (specifically the text "TNF-Mirror-Receiver").
2. Save this image as `template.png` in your current working directory. The
   script uses OpenCV template matching to find the window boundaries on your
   screen automatically.

### 4. Vision Outputs

When running, the script generates two files for AI consumption:

- `ai_vision_input.png`: A clean, cropped screenshot of the mobile display.
- `grid_for_ai.png`: The same screenshot with a 100px coordinate grid overlay to
  assist AI agents with spatial precision.

## Developer Integration

The vision bridge saves images to the disk for ingestion by any vision-enabled
model (e.g., GPT-4o, Claude 3.5 Sonnet).

### Sample JSON Protocol

AI agents should return interaction coordinates in a JSON format relative to
`(0,0)` at the top-left of the cropped image:

```json
{
  "action": "click",
  "x": 150,
  "y": 300,
  "reason": "Opening the Settings app"
}
```

The script will automatically map these coordinates to your desktop window and
perform the physical click action.

## Troubleshooting

- **Lag/Latency:** Ensure you are on a stable Wi-Fi network. You can further
  reduce latency by using a wired connection and adding the `-vsync no` flag.
- **Window Not Found:** Ensure `template.png` is an exact match for the window
  title bar font and color on your specific OS theme.
- **Retina Displays:** If using a Retina Mac, ensure the `pyautogui.click`
  coordinate scaling (x/2, y/2) is applied in your script.

## Backlinks

- [[documentation-index]]
- [[sovereign-state]]
