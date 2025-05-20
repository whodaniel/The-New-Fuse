import axios from 'axios';

const defaultOptions = {
    baseURL: 'https://api.anthropic.com/v1',
    headers: {
        'anthropic-version': '2023-06-01',
    },
};

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
    'anthropic-version': '2023-06-01',
};

const messages = messages
    .map(msg => `${msg.role === 'assistant' ? 'Assistant' : 'Human'}: ${msg.content}`)
    .join('\n\n');

await axios.post('/messages', {
    messages: [{ role: 'user', content: prompt }],
    max_tokens: this.maxTokens,
});
