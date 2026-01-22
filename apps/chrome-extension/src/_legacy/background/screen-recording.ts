/**
 * Screen Recording Service for TNF Chrome Extension
 *
 * Uses chrome.tabCapture and MediaRecorder to record browser sessions.
 * Recordings can be saved and uploaded via the TNF Relay.
 */

export class ScreenRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private recordingId: string | null = null;
  private isRecording: boolean = false;
  private recordingTabId: number | null = null;

  /**
   * Start recording the current tab
   */
  async startRecording(tabId?: number): Promise<{ recordingId: string; success: boolean }> {
    if (this.isRecording) {
      return {
        recordingId: this.recordingId || '',
        success: false,
      };
    }

    try {
      // Generate recording ID
      this.recordingId = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.recordedChunks = [];
      this.recordingTabId = tabId || null;

      // Use chrome.tabCapture to capture the tab
      const stream = await this.captureTab();
      if (!stream) {
        throw new Error('Failed to capture tab');
      }

      this.stream = stream;

      // Create MediaRecorder with the best available codec
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      // Handle data available event
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        this.stream?.getTracks().forEach((track) => track.stop());
        this.stream = null;
      };

      // Start recording
      this.mediaRecorder.start(1000); // Capture every second
      this.isRecording = true;

      console.log(`🔴 Screen recording started: ${this.recordingId}`);

      return {
        recordingId: this.recordingId,
        success: true,
      };
    } catch (error) {
      console.error('Failed to start recording:', error);
      return {
        recordingId: '',
        success: false,
      };
    }
  }

  /**
   * Stop recording and return the recorded data
   */
  async stopRecording(): Promise<{
    recordingId: string;
    blob: Blob;
    dataUrl: string;
    duration: number;
    success: boolean;
  }> {
    if (!this.isRecording || !this.mediaRecorder) {
      return {
        recordingId: '',
        blob: new Blob(),
        dataUrl: '',
        duration: 0,
        success: false,
      };
    }

    const recordingId = this.recordingId || '';

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        this.isRecording = false;
        this.stream?.getTracks().forEach((track) => track.stop());
        this.stream = null;

        // Create final blob
        const mimeType = this.getSupportedMimeType();
        const blob = new Blob(this.recordedChunks, { type: mimeType });

        // Convert to data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;

          console.log(`⏹️ Screen recording stopped: ${recordingId}`);

          resolve({
            recordingId,
            blob,
            dataUrl,
            duration: this.recordedChunks.length, // Approximate seconds
            success: true,
          });
        };
        reader.readAsDataURL(blob);
      };

      this.mediaRecorder!.stop();
    });
  }

  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get recording status
   */
  getStatus(): {
    isRecording: boolean;
    recordingId: string | null;
    duration: number;
  } {
    return {
      isRecording: this.isRecording,
      recordingId: this.recordingId,
      duration: this.recordedChunks.length,
    };
  }

  /**
   * Capture the current tab using chrome.tabCapture
   */
  private async captureTab(): Promise<MediaStream | null> {
    return new Promise((resolve) => {
      chrome.tabCapture.capture(
        {
          audio: true,
          video: true,
          videoConstraints: {
            mandatory: {
              minWidth: 1280,
              minHeight: 720,
              maxWidth: 1920,
              maxHeight: 1080,
              maxFrameRate: 30,
            },
          },
        },
        (stream) => {
          if (chrome.runtime.lastError) {
            console.error('Tab capture error:', chrome.runtime.lastError);
            resolve(null);
          } else {
            resolve(stream);
          }
        }
      );
    });
  }

  /**
   * Get the best supported video MIME type
   */
  private getSupportedMimeType(): string {
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4',
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return 'video/webm';
  }

  /**
   * Download the recording as a file
   */
  async downloadRecording(filename?: string): Promise<void> {
    if (this.recordedChunks.length === 0) {
      console.warn('No recording data to download');
      return;
    }

    const blob = new Blob(this.recordedChunks, {
      type: this.getSupportedMimeType(),
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename || `tnf-recording-${this.recordingId}.webm`;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}

// Singleton instance
export const screenRecordingService = new ScreenRecordingService();
