const { spawn } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function verifyOpenCodeCli() {
  console.log('\n🔍 Verifying OpenCode CLI (Codex)...');
  return new Promise((resolve) => {
    try {
      const prompt = 'Respond with "OK" if you are active.';
      const model = 'opencode/minimax-m2.5-free';
      const cliPath = 'opencode';

      // Use 'run' command which we verified works
      const args = ['run', prompt, '--model', model, '--format', 'json', '--log-level', 'ERROR'];

      const child = spawn(cliPath, args);

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const timeout = setTimeout(() => {
        child.kill();
        console.log('❌ OpenCode CLI timed out (30s).');
        resolve(false);
      }, 30000);

      child.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          try {
            // Find the line with type: "text"
            const lines = stdout.split('\n').filter(l => l.trim().startsWith('{'));
            let respondedOk = false;
            for (const line of lines) {
              const parsed = JSON.parse(line);
              if (parsed.type === 'text' && parsed.part && parsed.part.text.includes('OK')) {
                respondedOk = true;
                break;
              }
            }
            if (respondedOk) {
              console.log('✅ OpenCode CLI is ACTIVE and responding (via minimax-m2.5-free).');
              resolve(true);
            } else {
              console.log(`⚠️  OpenCode CLI responded, but "OK" not found in output.`);
              resolve(true);
            }
          } catch (e) {
            console.log(`✅ OpenCode CLI responded (raw): "${stdout.trim()}"`);
            resolve(true);
          }
        } else {
          console.log(`❌ OpenCode CLI failed (code ${code}): ${stderr}`);
          resolve(false);
        }
      });

      child.on('error', (err) => {
        clearTimeout(timeout);
        console.log(`❌ OpenCode CLI error: ${err.message}`);
        resolve(false);
      });
    } catch (error) {
      console.log(`❌ OpenCode CLI exception: ${error.message}`);
      resolve(false);
    }
  });
}

async function verifyKiloDirect() {
  console.log('\n🔍 Verifying Kilo API Direct (via OAuth)...');
  const authFile = path.join(process.env.HOME, '.local/share/opencode/auth.json');
  if (!fs.existsSync(authFile)) {
    console.log('⏭️  Skipping Kilo Direct (no auth file)');
    return false;
  }

  try {
    const auth = JSON.parse(fs.readFileSync(authFile, 'utf8'));
    const token = auth.kilocode?.access;
    if (!token) {
      console.log('⏭️  Skipping Kilo Direct (no access token)');
      return false;
    }

    const response = await fetch('https://api.kilo.ai/api/gateway/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'z-ai/glm-5:free',
        messages: [{ role: 'user', content: 'Respond with "OK" if you are active.' }]
      })
    });

    if (response.status === 401) {
      console.log('❌ Kilo API Direct: Unauthorized (token expired?)');
      return false;
    }

    const data = await response.json();
    if (data.choices && data.choices[0].message.content) {
      const text = data.choices[0].message.content;
      if (text.includes('OK')) {
        console.log('✅ Kilo API Direct is ACTIVE and responding.');
        return true;
      } else {
        console.log(`⚠️  Kilo API Direct responded: "${text}"`);
        return true;
      }
    } else {
      console.log(`❌ Kilo API Direct failed: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Kilo API Direct error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🧪 TNF LLM Connectivity Verification (v2)');
  console.log('========================================');

  const results = [];
  results.push(await verifyOpenCodeCli());
  results.push(await verifyKiloDirect());

  console.log('\n========================================');
  const passed = results.filter(r => r).length;
  console.log(`📊 Summary: ${passed}/${results.length} providers verified.`);
  
  if (passed === 0) {
    console.log('\n⚠️  No LLM providers are currently responding.');
  } else {
    console.log('\n🚀 TNF Harness has viable LLM connections. Ready for activation.');
  }
}

main().catch(console.error);
