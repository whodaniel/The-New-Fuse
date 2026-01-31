import { exec } from 'child_process';
import fs from 'fs';

const GEMINI_CLI = '/Users/<owner>/.nvm/versions/node/v24.12.0/bin/gemini';
const VIDEO_URL = 'https://www.youtube.com/watch?v=bIZB1hIJ4u8';
const PROMPT =
  'Analyze this video to extract all key points of information. Focus on AI-related concepts, innovations, and technical details. Provide a dense, structured summary.';

const command = `"${GEMINI_CLI}" -m "gemini-2.0-flash-exp" "${PROMPT} ${VIDEO_URL}"`;

console.log('Running command:', command);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    try {
      fs.writeFileSync('gemini_error.log', error.toString());
    } catch (e) {}
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    try {
      fs.writeFileSync('gemini_stderr.log', stderr);
    } catch (e) {}
  }

  console.log(`stdout: ${stdout}`);
  try {
    fs.writeFileSync('gemini_output.md', stdout);
  } catch (e) {}
});
