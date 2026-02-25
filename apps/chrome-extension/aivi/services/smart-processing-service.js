// Smart Video Processing Service
// Cost-optimized hierarchy: Free → Cheap → Expensive (only when needed)

class SmartProcessingService {
  constructor() {
    this.processingLevels = {
      METADATA: 'metadata', // FREE - YouTube API
      TRANSCRIPT: 'transcript', // FREE - YouTube captions
      FLASH: 'flash', // CHEAP - Gemini Flash
      PRO: 'pro', // MODERATE - Gemini Pro
      VISION: 'vision', // PREMIUM - Gemini Pro Vision
      AI_STUDIO: 'ai_studio', // ADVANCED - Full video analysis
    };

    this.costs = {
      METADATA: 0,
      TRANSCRIPT: 0,
      FLASH: 0.000075, // per 1K tokens
      PRO: 0.00125, // per 1K tokens
      VISION: 0.002, // per 1K tokens
      AI_STUDIO: 0, // Uses user's Gemini Pro account
    };
  }

  // Determine optimal processing level based on requirements
  async determineProcessingLevel(video, requirements) {
    const { detailLevel, budget, urgency, contentType } = requirements;

    // Quick overview? Use metadata + transcript
    if (detailLevel === 'quick') {
      return this.processingLevels.TRANSCRIPT;
    }

    // Standard analysis? Use Gemini Flash
    if (detailLevel === 'standard') {
      return this.processingLevels.FLASH;
    }

    // Deep analysis? Use Gemini Pro
    if (detailLevel === 'deep') {
      return this.processingLevels.PRO;
    }

    // Visual content? Use Vision
    if (contentType === 'visual' || video.hasVisualContent) {
      return this.processingLevels.VISION;
    }

    // Full analysis with user's account? Use AI Studio
    if (detailLevel === 'comprehensive') {
      return this.processingLevels.AI_STUDIO;
    }

    // Default: Start cheap, escalate if needed
    return this.processingLevels.TRANSCRIPT;
  }

  // Process video with smart hierarchy
  async processVideo(video, requirements = {}) {
    const results = {
      video: video,
      levels: [],
      totalCost: 0,
      finalOutput: null,
    };

    try {
      // Level 1: Always get metadata (FREE)
      const metadata = await this.getMetadata(video);
      results.levels.push({
        level: 'METADATA',
        cost: 0,
        data: metadata,
      });

      // Check if metadata is sufficient
      if (this.isMetadataSufficient(metadata, requirements)) {
        results.finalOutput = this.formatMetadata(metadata);
        return results;
      }

      // Level 2: Try transcript (FREE)
      const transcript = await this.getTranscript(video);
      if (transcript) {
        results.levels.push({
          level: 'TRANSCRIPT',
          cost: 0,
          data: transcript,
        });

        // Check if transcript is sufficient
        if (this.isTranscriptSufficient(transcript, requirements)) {
          results.finalOutput = await this.analyzeTranscript(transcript, 'flash');
          return results;
        }
      }

      // Level 3: Determine best AI model
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
          results.totalCost = 0; // Uses user's account
          break;
      }

      results.levels.push({
        level: level,
        cost: results.totalCost,
        data: results.finalOutput,
      });

      return results;
    } catch (error) {
      console.error('Smart processing failed:', error);
      throw error;
    }
  }

  // Level 1: Get metadata (FREE)
  async getMetadata(video) {
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

  // Level 2: Get transcript (FREE)
  async getTranscript(video) {
    try {
      // Use YouTube Transcript API
      const response = await fetch(`https://www.youtube.com/api/timedtext?lang=en&v=${video.id}`);

      if (!response.ok) return null;

      const xml = await response.text();
      const transcript = this.parseTranscript(xml);

      return transcript;
    } catch (error) {
      console.error('Failed to get transcript:', error);
      return null;
    }
  }

  // Parse XML transcript
  parseTranscript(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const texts = doc.querySelectorAll('text');

    let transcript = '';
    texts.forEach((text) => {
      transcript += text.textContent + ' ';
    });

    return transcript.trim();
  }

  // Check if metadata is sufficient
  isMetadataSufficient(metadata, requirements) {
    // For quick overviews, metadata might be enough
    if (requirements.detailLevel === 'minimal') {
      return true;
    }

    // If we just need duration, title, etc.
    if (requirements.needsOnly === 'basic_info') {
      return true;
    }

    return false;
  }

  // Check if transcript is sufficient
  isTranscriptSufficient(transcript, requirements) {
    // If transcript is too short, might not be useful
    if (!transcript || transcript.length < 100) {
      return false;
    }

    // For standard analysis, transcript is often enough
    if (requirements.detailLevel === 'quick' || requirements.detailLevel === 'standard') {
      return true;
    }

    return false;
  }

  // Format metadata as output
  formatMetadata(metadata) {
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

  // Level 3: Process with Gemini Flash (CHEAP)
  async processWithFlash(video, transcript) {
    const prompt = `Analyze this YouTube video and extract key AI-related concepts:

Title: ${video.title}
Transcript: ${transcript}

Extract:
1. Main AI concepts discussed
2. Technical innovations mentioned
3. Key takeaways
4. Practical applications

Provide a concise, structured summary.`;

    return await this.callGeminiAPI('gemini-1.5-flash', prompt);
  }

  // Level 4: Process with Gemini Pro (MODERATE)
  async processWithPro(video, transcript) {
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

    return await this.callGeminiAPI('gemini-1.5-pro', prompt);
  }

  // Level 5: Process with Gemini Pro Vision (PREMIUM)
  async processWithVision(video) {
    // This would analyze video frames + audio
    // For now, redirect to AI Studio which handles this
    return await this.processWithAIStudio(video);
  }

  // Level 6: Process with AI Studio (Uses user's Gemini Pro account)
  async processWithAIStudio(video) {
    // This uses the existing AI Studio automation
    // Which leverages the user's own Gemini Pro subscription
    return await chrome.runtime.sendMessage({
      type: 'PROCESS_WITH_AI_STUDIO',
      data: { video },
    });
  }

  // Call Gemini API
  async callGeminiAPI(model, prompt) {
    try {
      const apiKey = await this.getGeminiAPIKey();

      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  // Get Gemini API key from storage
  async getGeminiAPIKey() {
    const { geminiApiKey } = await chrome.storage.local.get('geminiApiKey');
    return geminiApiKey;
  }

  // Estimate cost
  estimateCost(content, level) {
    const tokens = this.estimateTokens(content);
    const costPer1K = this.costs[level];
    return (tokens / 1000) * costPer1K;
  }

  // Estimate tokens (rough approximation)
  estimateTokens(content) {
    if (typeof content === 'string') {
      // Rough estimate: 1 token ≈ 4 characters
      return Math.ceil(content.length / 4);
    }

    if (content.duration) {
      // For video: estimate based on duration
      // Assume ~150 words per minute, ~1.3 tokens per word
      const minutes = content.duration / 60;
      return Math.ceil(minutes * 150 * 1.3);
    }

    return 1000; // Default estimate
  }

  // Format duration
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  // Analyze transcript with specified model
  async analyzeTranscript(transcript, model = 'flash') {
    const prompt = `Extract key AI-related information from this transcript:

${transcript}

Focus on:
- AI concepts and innovations
- Technical details
- Practical applications
- Key insights

Provide a structured summary.`;

    const modelName = model === 'flash' ? 'gemini-1.5-flash' : 'gemini-1.5-pro';
    return await this.callGeminiAPI(modelName, prompt);
  }
}

// Export singleton
const smartProcessingService = new SmartProcessingService();
export default smartProcessingService;
