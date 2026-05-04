import { API_URLS, AI_MODELS } from '../../shared/constants';

interface VideoData {
  id: string;
  title?: string;
  description?: string;
  url?: string;
  channelTitle?: string;
  publishedAt?: string;
  hasVisualContent?: boolean;
  duration?: number;
}

interface ProcessingResult {
  video: VideoData;
  levels: Array<{ level: string; cost: number; data: any }>;
  totalCost: number;
  finalOutput: any;
}

interface Requirements {
  detailLevel?: string;
  budget?: number;
  urgency?: string;
  contentType?: string;
  needsOnly?: string;
}

class SmartProcessingService {
  private processingLevels: Record<string, string> = {
    METADATA: 'metadata',
    TRANSCRIPT: 'transcript',
    FLASH: 'flash',
    PRO: 'pro',
    VISION: 'vision',
    AI_STUDIO: 'ai_studio',
  };

  private costs: Record<string, number> = {
    METADATA: 0,
    TRANSCRIPT: 0,
    FLASH: 0.000075,
    PRO: 0.00125,
    VISION: 0.002,
    AI_STUDIO: 0,
  };

  async determineProcessingLevel(video: VideoData, requirements: Requirements): Promise<string> {
    const { detailLevel, contentType } = requirements;

    if (detailLevel === 'quick') return this.processingLevels.TRANSCRIPT;
    if (detailLevel === 'standard') return this.processingLevels.FLASH;
    if (detailLevel === 'deep') return this.processingLevels.PRO;
    if (contentType === 'visual' || video.hasVisualContent) return this.processingLevels.VISION;
    if (detailLevel === 'comprehensive') return this.processingLevels.AI_STUDIO;

    return this.processingLevels.TRANSCRIPT;
  }

  async processVideo(video: VideoData, requirements: Requirements = {}): Promise<ProcessingResult> {
    const results: ProcessingResult = { video, levels: [], totalCost: 0, finalOutput: null };

    try {
      const metadata = await this.getMetadata(video);
      results.levels.push({ level: 'METADATA', cost: 0, data: metadata });

      if (this.isMetadataSufficient(metadata, requirements)) {
        results.finalOutput = this.formatMetadata(metadata);
        return results;
      }

      const transcript = await this.getTranscript(video);
      if (transcript) {
        results.levels.push({ level: 'TRANSCRIPT', cost: 0, data: transcript });
        if (this.isTranscriptSufficient(transcript, requirements)) {
          results.finalOutput = await this.analyzeTranscript(transcript, 'flash');
          return results;
        }
      }

      const level = await this.determineProcessingLevel(video, requirements);

      switch (level) {
        case this.processingLevels.FLASH:
          results.finalOutput = await this.processWithFlash(video, transcript);
          results.totalCost += this.estimateCost(transcript, 'FLASH');
          break;
        case this.processingLevels.PRO:
          results.finalOutput = await this.processWithPro(video, transcript);
          results.totalCost += this.estimateCost(transcript, 'PRO');
          break;
        case this.processingLevels.VISION:
          results.finalOutput = await this.processWithVision(video);
          results.totalCost += this.estimateCost(video, 'VISION');
          break;
        case this.processingLevels.AI_STUDIO:
          results.finalOutput = await this.processWithAIStudio(video);
          results.totalCost = 0;
          break;
      }

      results.levels.push({ level, cost: results.totalCost, data: results.finalOutput });
      return results;
    } catch (error) {
      console.error('Smart processing failed:', error);
      throw error;
    }
  }

  private async getMetadata(video: VideoData): Promise<any> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'YOUTUBE_GET_VIDEO_DETAILS',
        data: { videoIds: [video.id] },
      });

      if (response.success && response.data.length > 0) {
        const details = response.data[0];
        return {
          title: details.title,
          description: video.description || '',
          duration: details.duration,
          channelTitle: details.channelTitle,
          viewCount: details.viewCount,
          likeCount: details.likeCount,
          publishedAt: video.publishedAt,
          tags: details.tags || [],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get metadata:', error);
      return null;
    }
  }

  private async getTranscript(video: VideoData): Promise<string | null> {
    try {
      const response = await fetch(`${API_URLS.youtubeTranscript}?lang=en&v=${video.id}`);
      if (!response.ok) return null;
      const xml = await response.text();
      return this.parseTranscript(xml);
    } catch (error) {
      console.error('Failed to get transcript:', error);
      return null;
    }
  }

  private parseTranscript(xml: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const texts = doc.querySelectorAll('text');
    let transcript = '';
    texts.forEach((text) => { transcript += text.textContent + ' '; });
    return transcript.trim();
  }

  private isMetadataSufficient(metadata: any, requirements: Requirements): boolean {
    if (requirements.detailLevel === 'minimal') return true;
    if (requirements.needsOnly === 'basic_info') return true;
    return false;
  }

  private isTranscriptSufficient(transcript: string | null, requirements: Requirements): boolean {
    if (!transcript || transcript.length < 100) return false;
    if (requirements.detailLevel === 'quick' || requirements.detailLevel === 'standard') return true;
    return false;
  }

  private formatMetadata(metadata: any): string {
    return `# ${metadata.title}

**Channel:** ${metadata.channelTitle}
**Duration:** ${this.formatDuration(metadata.duration)}
**Views:** ${metadata.viewCount?.toLocaleString() || 'N/A'}
**Published:** ${new Date(metadata.publishedAt).toLocaleDateString()}

## Description
${metadata.description}

${metadata.tags?.length > 0 ? `**Tags:** ${metadata.tags.join(', ')}` : ''}
`;
  }

  private async processWithFlash(video: VideoData, transcript: string | null): Promise<string> {
    const prompt = `Analyze this YouTube video and extract key AI-related concepts:

Title: ${video.title}
Transcript: ${transcript}

Extract:
1. Main AI concepts discussed
2. Technical innovations mentioned
3. Key takeaways
4. Practical applications

Provide a concise, structured summary.`;

    return await this.callGeminiAPI(AI_MODELS.geminiFlash, prompt);
  }

  private async processWithPro(video: VideoData, transcript: string | null): Promise<string> {
    const prompt = `Perform a comprehensive analysis of this YouTube video:

Title: ${video.title}
Channel: ${video.channelTitle}
Transcript: ${transcript}

Provide a detailed analysis including:
1. Core AI concepts and innovations
2. Technical implementation details
3. Theoretical foundations
4. Practical applications
5. Related research and papers
6. Key insights and takeaways

Format as structured markdown with clear sections.`;

    return await this.callGeminiAPI(AI_MODELS.geminiPro, prompt);
  }

  private async processWithVision(video: VideoData): Promise<any> {
    return await this.processWithAIStudio(video);
  }

  private async processWithAIStudio(video: VideoData): Promise<any> {
    return await chrome.runtime.sendMessage({
      type: 'PROCESS_WITH_AI_STUDIO',
      data: { video },
    });
  }

  private async callGeminiAPI(model: string, prompt: string): Promise<string> {
    try {
      const apiKey = await this.getGeminiAPIKey();
      if (!apiKey) throw new Error('Gemini API key not configured');

      const response = await fetch(
        `${API_URLS.geminiApi}/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );

      if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  private async getGeminiAPIKey(): Promise<string | undefined> {
    const { geminiApiKey } = (await chrome.storage.local.get('geminiApiKey')) as { geminiApiKey?: string };
    return geminiApiKey;
  }

  private estimateCost(content: any, level: string): number {
    const tokens = this.estimateTokens(content);
    const costPer1K = this.costs[level];
    return (tokens / 1000) * costPer1K;
  }

  private estimateTokens(content: any): number {
    if (typeof content === 'string') return Math.ceil(content.length / 4);
    if (content?.duration) {
      const minutes = content.duration / 60;
      return Math.ceil(minutes * 150 * 1.3);
    }
    return 1000;
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  private async analyzeTranscript(transcript: string, model: string = 'flash'): Promise<string> {
    const prompt = `Extract key AI-related information from this transcript:

${transcript}

Focus on:
- AI concepts and innovations
- Technical details
- Practical applications
- Key insights

Provide a structured summary.`;

    const modelName = model === 'flash' ? AI_MODELS.geminiFlash : AI_MODELS.geminiPro;
    return await this.callGeminiAPI(modelName, prompt);
  }
}

const smartProcessingService = new SmartProcessingService();
export default smartProcessingService;
