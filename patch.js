const fs = require('fs');
const file =
  '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/scripts/tnf-agent-cli.cjs';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("require('crypto')")) {
  code = code.replace(
    "const readline = require('readline');",
    "const readline = require('readline');\nconst crypto = require('crypto');"
  );
}

const signFunction = `
  signMessage(data, type, channel) {
    const secret = process.env.A2A_SECRET_KEY || 'default-secret';
    const header = {
      agent_id: this.agentInfo.id,
      alg: 'HS256',
      nonce: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
    };

    const payload = {
      type,
      channel,
      data,
    };

    const messageToSign = JSON.stringify({ header, payload });
    const signature = crypto.createHmac('sha256', secret).update(messageToSign).digest('hex');

    return { header, payload, signature };
  }
`;

if (!code.includes('signMessage(data, type, channel)')) {
  code = code.replace(
    '  async send(content, options = {}) {',
    signFunction + '\n  async send(content, options = {}) {'
  );
}

code = code.replace(
  'await this.publisher.publish(channel, JSON.stringify(message));',
  'const signedMessage = this.signMessage(message, message.type, channel);\n    await this.publisher.publish(channel, JSON.stringify(signedMessage));'
);

fs.writeFileSync(file, code);
console.log('Patched tnf-agent-cli.cjs successfully');
