
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class CopilotLoop {
  private active: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private intervalMs: number = 30000; // Default 30s
  private directives: string = "Extract key information regarding user activity, context, and potential needs from this screen.";
  private apiEndpoint: string = "http://127.0.0.1:18789/v1/chat/completions";
  private model: string = "kilo/z-ai/glm-5:free"; // Default from openclaw.json, user can override
  private lastCaptureTime: number = 0;

  constructor() {
    // Ensure temp dir exists? standard temp is fine.
  }

  public setConfig(config: { intervalMs?: number, directives?: string, apiEndpoint?: string, model?: string }) {
    if (config.intervalMs) this.intervalMs = config.intervalMs;
    if (config.directives) this.directives = config.directives;
    if (config.apiEndpoint) this.apiEndpoint = config.apiEndpoint;
    if (config.model) this.model = config.model;
  }

  public start() {
    if (this.active) return;
    this.active = true;
    console.log('[CopilotLoop] Starting loop...');
    this.loop(); // Run immediately
    this.intervalId = setInterval(() => this.loop(), this.intervalMs);
  }

  public stop() {
    if (!this.active) return;
    this.active = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[CopilotLoop] Stopped loop.');
  }

  public isActive(): boolean {
    return this.active;
  }

  private async loop() {
    if (!this.active) return;

    const timestamp = Date.now();
    // Throttle just in case
    if (timestamp - this.lastCaptureTime < 1000) return;
    this.lastCaptureTime = timestamp;

    const screenshotPath = path.join(app.getPath('temp'), `tnf_copilot_${timestamp}.png`);

    try {
      // 1. Capture
      // -x: muted, -C: capture cursor (optional, maybe better without), -t png: format
      // -r: capture main monitor? Or default (all). Default usually captures all or main.
      // Let's use -x (no sound) and default args for now.
      await execAsync(`screencapture -x -t png "${screenshotPath}"`);

      // Verify file exists
      if (!fs.existsSync(screenshotPath)) {
        console.error('[CopilotLoop] Screenshot failed, file not found:', screenshotPath);
        return;
      }

      // 2. Read & Encode
      const imageBuffer = fs.readFileSync(screenshotPath);
      const base64Image = imageBuffer.toString('base64');
      const dataUri = `data:image/png;base64,${base64Image}`;

      // 3. Analyze (Send to OpenClaw)
      // We assume an endpoint that accepts JSON with image and prompt
      // This is a PLACEHOLDER implementation that needs the real OpenClaw API
      // Since we don't know the API, we'll try a generic structure often used by VLM tools
      // or we can try to use the 'chat' endpoint if we can reverse engineer it.
      // For now, let's log that we WOULD send it.

      console.log(`[CopilotLoop] Analyzing screenshot (${imageBuffer.length} bytes)...`);

      try {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: this.directives },
                            { type: "image_url", image_url: { url: dataUri } }
                        ]
                    }
                ],
                max_tokens: 500
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('[CopilotLoop] Analysis result:', JSON.stringify(result).substring(0, 200) + '...');
            // In a real implementation, we would store this context in a database or emit it to the active session.
        } else {
            console.warn('[CopilotLoop] Analysis API returned error:', response.status, response.statusText);
            const text = await response.text();
            console.warn('[CopilotLoop] Error details:', text.substring(0, 200));
        }
      } catch (netError) {
        console.error('[CopilotLoop] Network error sending to OpenClaw:', netError);
      }

    } catch (error) {
      console.error('[CopilotLoop] Error in loop:', error);
    } finally {
      // 4. Cleanup (Security Wall)
      if (fs.existsSync(screenshotPath)) {
        try {
            fs.unlinkSync(screenshotPath);
            console.log('[CopilotLoop] Screenshot deleted.');
        } catch (delError) {
            console.error('[CopilotLoop] Failed to delete screenshot:', delError);
        }
      }
    }
  }
}
