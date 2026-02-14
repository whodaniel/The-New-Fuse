import fs from 'fs';
import path from 'path';

import { google } from 'googleapis';

// Load credentials from file manually to control formatting
const keyFilePath = path.join(__dirname, '../credentials.json');

export const getAuthClient = async () => {
  const content = fs.readFileSync(keyFilePath, 'utf-8');
  const credentials = JSON.parse(content);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });

  return await auth.getClient();
};
