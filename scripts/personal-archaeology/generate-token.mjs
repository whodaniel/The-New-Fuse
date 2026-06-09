import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const CREDENTIALS_PATH = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || path.join(__dirname, 'credentials.json');
const TOKEN_PATH = process.env.GOOGLE_DRIVE_TOKEN_PATH || path.join(__dirname, 'token.json');

if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error('Error: Please place your OAuth 2.0 credentials.json in this directory first.');
  process.exit(1);
}

const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
const credentials = JSON.parse(content);
const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('Authorize this app by visiting this url:');
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', (code) => {
  rl.close();
  oAuth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error('Error retrieving access token', err);
      return;
    }
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2), { mode: 0o600 });
    console.log('Token stored to', TOKEN_PATH);
    console.log('You are now ready to run `node index.mjs`.');
  });
});
