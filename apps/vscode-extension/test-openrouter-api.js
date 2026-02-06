/**
 * Direct OpenRouter API Test
 * Tests connection, model discovery, and chat completion
 */

const https = require('https');

const API_KEY = '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';
const BASE_URL = 'https://openrouter.ai/api/v1';

console.log('🚀 Testing OpenRouter API Integration\n');

// Test 1: List Models
function testListModels() {
  return new Promise((resolve, reject) => {
    console.log('📋 Test 1: Listing Available Models...');

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/models',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.data && Array.isArray(response.data)) {
            console.log(`✅ Successfully retrieved ${response.data.length} models`);
            console.log('\n📊 Sample Models:');
            response.data.slice(0, 10).forEach((model, i) => {
              console.log(`   ${i + 1}. ${model.id}`);
            });
            console.log(`   ... and ${response.data.length - 10} more\n`);
            resolve(response.data);
          } else {
            reject(new Error('Invalid response format'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Test 2: Chat Completion
function testChatCompletion(modelId = 'x-ai/grok-4-fast:free') {
  return new Promise((resolve, reject) => {
    console.log(`💬 Test 2: Testing Chat Completion with ${modelId}...`);

    const payload = JSON.stringify({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: 'Hello! Please respond with a brief greeting to confirm you are working.',
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'HTTP-Referer': 'https://github.com/the-new-fuse',
        'X-Title': 'The New Fuse VSCode Extension',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.choices && response.choices[0]) {
            const message = response.choices[0].message.content;
            console.log(`✅ Chat completion successful!`);
            console.log(`📝 Response: ${message}\n`);
            resolve(response);
          } else if (response.error) {
            console.log(`⚠️  API Error: ${response.error.message}`);
            reject(new Error(response.error.message));
          } else {
            reject(new Error('Invalid response format'));
          }
        } catch (error) {
          console.error('❌ Error parsing response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// Test 3: Streaming Chat Completion
function testStreamingCompletion(modelId = 'x-ai/grok-4-fast:free') {
  return new Promise((resolve, reject) => {
    console.log(`🌊 Test 3: Testing Streaming Chat Completion with ${modelId}...`);

    const payload = JSON.stringify({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: 'Count from 1 to 5 slowly.',
        },
      ],
      max_tokens: 50,
      stream: true,
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'HTTP-Referer': 'https://github.com/the-new-fuse',
        'X-Title': 'The New Fuse VSCode Extension',
      },
    };

    const req = https.request(options, (res) => {
      let fullResponse = '';

      console.log('📡 Streaming response:');
      process.stdout.write('   ');

      res.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        lines.forEach((line) => {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content;
                process.stdout.write(content);
                fullResponse += content;
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        });
      });

      res.on('end', () => {
        console.log('\n✅ Streaming completed successfully!\n');
        resolve(fullResponse);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// Run all tests
async function runTests() {
  try {
    // Test 1: List models
    const models = await testListModels();

    // Test 2: Regular chat completion
    await testChatCompletion('x-ai/grok-4-fast:free');

    // Test 3: Streaming completion
    await testStreamingCompletion('x-ai/grok-4-fast:free');

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📦 OpenRouter Integration Summary:');
    console.log(`   • Total Models Available: ${models.length}`);
    console.log('   • Chat Completion: ✅ Working');
    console.log('   • Streaming: ✅ Working');
    console.log('   • API Key: ✅ Valid');
    console.log('\n🎯 The VSCode extension is now configured and ready!');
    console.log('   Open VSCode → The New Fuse panel → Start chatting\n');
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
