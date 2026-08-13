import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios from 'axios';
import { z } from 'zod';

const RELAY_BASE_URL = process.env.TNF_VISION_RELAY_URL || 'http://localhost:8080';

const server = new McpServer({
  name: 'tnf-native-vision',
  version: '1.0.0',
});

// Tool: capture_screen
// @ts-ignore
server.tool(
  'capture_screen',
  'Captures a high-speed screenshot of the Mac desktop or iPhone mirror via the Native Forge Bridge.',
  {
    quality: z.number().min(10).max(100).optional().default(85),
  },
  async ({ quality }) => {
    try {
      const response = await axios.get(`${RELAY_BASE_URL}/ai/frame?quality=${quality}`, {
        responseType: 'arraybuffer',
      });
      const base64 = Buffer.from(response.data).toString('base64');

      return {
        content: [
          {
            type: 'text',
            text: 'Successfully captured frame.',
          },
          {
            type: 'image',
            data: base64,
            mimeType: 'image/jpeg',
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to capture frame: ${error.message}. Ensure tnf_remote_relay.py is running.`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: get_annotations
// @ts-ignore
server.tool(
  'get_annotations',
  'Retrieves user annotation strokes from the vision bridge overlay.',
  {},
  async () => {
    try {
      const response = await axios.get(`${RELAY_BASE_URL}/ai/annotations`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Failed to get annotations: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool: say_text
// @ts-ignore
server.tool(
  'say_text',
  'Speak text through the Mac speakers via the vision bridge TTS engine.',
  {
    text: z.string().describe('Text to speak'),
    voice: z.string().optional().default('Daniel'),
    rate: z.number().optional().default(190),
  },
  async ({ text, voice, rate }) => {
    try {
      await axios.post(`${RELAY_BASE_URL}/ai/say`, { text, voice, rate });
      return {
        content: [{ type: 'text', text: `Successfully spoke: "${text}"` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Failed to speak: ${error.message}` }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('TNF Native Vision MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
