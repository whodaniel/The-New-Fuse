import { createSpreadsheet, shareSpreadsheet, writeSheet } from '../tools.js';

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const idIndex = args.indexOf('--id');
  const existingId = idIndex !== -1 ? args[idIndex + 1] : undefined;

  const folderIdArgIndex = args.findIndex((arg) => !arg.startsWith('--') && arg !== existingId);
  const folderId = folderIdArgIndex !== -1 ? args[folderIdArgIndex] : undefined;

  const EMAIL = 'owner@example.com';
  const SHEET_NAME = 'The New Fuse - SaaS Inventory';

  try {
    let spreadsheetId = existingId;

    if (!spreadsheetId) {
      console.log(`Creating spreadsheet: ${SHEET_NAME}...`);
      if (folderId) {
        console.log(`Using Parent Folder ID: ${folderId}`);
      }

      // @ts-ignore
      const sheet = await createSpreadsheet(SHEET_NAME, folderId);
      spreadsheetId = sheet.spreadsheetId as string;
    } else {
      console.log(`Using existing spreadsheet ID: ${spreadsheetId}`);
    }

    console.log(`Spreadsheet ID: ${spreadsheetId}`);

    if (!existingId) {
      console.log(`Sharing with: ${EMAIL}...`);
      await shareSpreadsheet(spreadsheetId, EMAIL, 'writer');
      console.log('Shared successfully.');
    } else {
      console.log('Skipping sharing for existing spreadsheet.');
    }

    console.log('Setting up headers...');
    const HEADERS = [
      ['Name', 'Category', 'Cost', 'Value', 'Integration Potential', 'Note', 'Status'],
    ];
    await writeSheet(spreadsheetId, 'Sheet1!A1:G1', HEADERS);
    console.log('Headers written.');

    console.log('\n--- SPREADSHEET READY ---');
    console.log(`URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);
