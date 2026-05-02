import { google } from 'googleapis';

import { getAuthClient } from './auth';

async function getSheetsService() {
  const auth = await getAuthClient();
  // @ts-ignore
  return google.sheets({ version: 'v4', auth });
}

export const readSheet = async (spreadsheetId: string, range: string) => {
  const sheets = await getSheetsService();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return res.data.values;
};

export const writeSheet = async (spreadsheetId: string, range: string, values: any[][]) => {
  const sheets = await getSheetsService();
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
  return res.data;
};

export const appendToSheet = async (spreadsheetId: string, range: string, values: any[][]) => {
  const sheets = await getSheetsService();
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
  return res.data;
};

export const clearRange = async (spreadsheetId: string, range: string) => {
  const sheets = await getSheetsService();
  const res = await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range,
  });
  return res.data;
};

export const createSpreadsheet = async (title: string, parentFolderId?: string) => {
  const sheets = await getSheetsService();
  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
    },
  });

  // If a parent folder is specified, we need to move the file
  if (parentFolderId && res.data.spreadsheetId) {
    const auth = await getAuthClient();
    // @ts-ignore
    const drive = google.drive({ version: 'v3', auth });
    const fileId = res.data.spreadsheetId;

    // Move the file to the new parent
    // First retrieve the existing parents to remove them
    const getRes = await drive.files.get({
      fileId,
      fields: 'parents',
    });

    const previousParents = getRes.data.parents?.join(',') || '';

    await drive.files.update({
      fileId,
      addParents: parentFolderId,
      removeParents: previousParents,
      fields: 'id, parents',
    });
  }

  return res.data;
};

export const shareSpreadsheet = async (
  spreadsheetId: string,
  emailAddress: string,
  role: string
) => {
  const auth = await getAuthClient();
  // @ts-ignore
  const drive = google.drive({ version: 'v3', auth });

  const res = await drive.permissions.create({
    fileId: spreadsheetId,
    requestBody: {
      role,
      type: 'user',
      emailAddress,
    },
    fields: 'id',
  });

  return res.data;
};
