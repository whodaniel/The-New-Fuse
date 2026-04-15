const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env
const envPath = path.join(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const PROJECT_ID = envConfig.VITE_FIREBASE_PROJECT_ID || 'the-new-fuse-2025';
const CLIENT_ID = envConfig.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = envConfig.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = envConfig.GOOGLE_REFRESH_TOKEN;

async function run() {
  try {
    console.log('--- Firebase Auth Domain Updater (V6 API) ---');

    if (!REFRESH_TOKEN || !CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Missing Google Credentials in .env');
    }

    // 1. Get Access Token
    console.log('Step 1: Exchanging refresh token for access token...');
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: 'refresh_token',
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Access token acquired.');

    // 2. Get Current Config
    console.log(`Step 2: Fetching current identity config for ${PROJECT_ID}...`);
    const configUrl = `https://identitytoolkit.googleapis.com/v2/projects/${PROJECT_ID}/config`;

    const getConfigResponse = await axios.get(configUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const currentConfig = getConfigResponse.data;
    const existingDomains = currentConfig.authorizedDomains || [];
    console.log('Current Domains:', existingDomains);

    // 3. Prepare New Domains
    const domainsToAdd = [
      'localhost',
      '127.0.0.1',
      'localhost:3000',
      'localhost:3002',
      'localhost:5173',
      'the-new-fuse-2025.firebaseapp.com',
      'the-new-fuse-2025.web.app',
      'chrome-extension://fkbcklmcikdhpggaimfhomgncneppkbj',
      'chrome-extension://kddfgejmbblgadkdmalfnagbiefbcdmi',
    ];

    const updatedDomains = Array.from(new Set([...existingDomains, ...domainsToAdd]));
    console.log('New Goal Domains:', updatedDomains);

    // 4. Update Config
    console.log('Step 3: Patching authorized domains...');
    await axios.patch(
      `${configUrl}?updateMask=authorizedDomains`,
      {
        authorizedDomains: updatedDomains,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    console.log('🚀 SUCCESS! Authorized domains updated.');
    console.log('NOTE: Propagation may take 1-5 minutes in Firebase.');
  } catch (error) {
    console.error('❌ FAILED:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

run();
