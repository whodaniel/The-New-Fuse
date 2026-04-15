const fs = require('fs');
const https = require('https');

const configPath = '/path/to/.railway/config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const token = config.user.token;

const deploymentIds = [
  '6a6739ac-1cc4-425c-b621-d9468804831e',
  '426b7ad2-b213-4187-8c21-a13a05e29ff8',
  '22eb3d96-b6cd-44b3-970c-05514ecf992d',
];

function nuke(id) {
  const postData = JSON.stringify({
    query: `
      mutation {
        deploymentRemove(id: "${id}")
      }
    `,
  });

  const options = {
    hostname: 'backboard.railway.com',
    port: 443,
    path: '/graphql/v2',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Length': postData.length,
    },
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`ID: ${id} - Status: ${res.statusCode} - Body: ${data}`);
    });
  });

  req.on('error', (e) => {
    console.error(`ID: ${id} - Error: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

deploymentIds.forEach((id) => nuke(id));
