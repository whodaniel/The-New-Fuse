/**
 * Configuration for OpenAI API integration.
 */
interface AIConfig {
    apiKey: string;
    model: string;
    baseURL: string;
}

export const aiConfig: AIConfig = {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    baseURL: 'https://api.openai.com/v1'
};
