export class MultiAgentChatLLMService {
    apiKeys = {};
    constructor(apiKeys) {
        this.apiKeys = apiKeys || {};
    }
    async callTextAPI(prompt, systemPrompt, llm = 'gemini') {
        try {
            switch (llm) {
                case 'gemini':
                    return await this.callGeminiAPI(prompt, systemPrompt);
                case 'openai':
                    return await this.callOpenAIAPI(prompt, systemPrompt);
                case 'anthropic':
                    return await this.callAnthropicAPI(prompt, systemPrompt);
                default:
                    return await this.callGeminiAPI(prompt, systemPrompt);
            }
        }
        catch (error) {
            console.error(`Error calling ${llm} API:, error);`);
            return `Error: Failed to generate response from ${llm}`;
        }
    }
    async callGeminiAPI(prompt, systemPrompt) {
        const apiKey = this.apiKeys.gemini || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('Gemini API key not configured');
        }
        const response = await fetch(https, //generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}, {
        method, 'POST', headers, {
            'Content-Type': 'application/json',
        }, body, JSON.stringify({
            contents: [{
                    parts: [{} `
            text: ${systemPrompt}`, n, n$, { prompt }]
                }]
        }));
    }
}
;
`
`;
if (!response.ok) {
    throw new Error(Gemini, API, error, $, { response, : .status });
}
const data = await response.json();
return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
async;
callOpenAIAPI(prompt, string, systemPrompt, string);
Promise < string > {
    const: apiKey = this.apiKeys.openai || process.env.OPENAI_API_KEY,
    if(, apiKey) {
        throw new Error('OpenAI API key not configured');
    },
    const: response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {} `
        'Content-Type': 'application/json',`,
        'Authorization': `Bearer ${apiKey}
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    });
`,
        if(, response) { }, : .ok
    })
};
{
    `
      throw new Error(OpenAI API error: ${response.status}`;
    ;
}
const data = await response.json();
return data.choices?.[0]?.message?.content || 'No response generated';
async;
callAnthropicAPI(prompt, string, systemPrompt, string);
Promise < string > {
    const: apiKey = this.apiKeys.anthropic || process.env.ANTHROPIC_API_KEY,
    if(, apiKey) {
        throw new Error('Anthropic API key not configured');
    },
    const: response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{
                    role: 'user',
                    content: prompt
                }]
        })
    }),
    if(, response) { }, : .ok
};
{
    throw new Error(Anthropic, API, error, $, { response, : .status } `);
    }

    const data = await response.json();
    return data.content?.[0]?.text || 'No response generated';
  }

  async generateImage(request: ImageGenerationRequest): Promise<{ url: string }> {
    // For demo purposes, return a placeholder image
    // In a real implementation, this would call an image generation API
    const placeholderUrls = [
      'https://via.placeholder.com/256x256/4F46E5/FFFFFF?text=AI+Generated',
      'https://via.placeholder.com/256x256/7C3AED/FFFFFF?text=Profile+Pic',
      'https://via.placeholder.com/256x256/EC4899/FFFFFF?text=Avatar'
    ];

    const randomUrl = placeholderUrls[Math.floor(Math.random() * placeholderUrls.length)];

    return {
      url: randomUrl
    };
  }
});
}
//# sourceMappingURL=multi-agent-chat-llm.service.js.map