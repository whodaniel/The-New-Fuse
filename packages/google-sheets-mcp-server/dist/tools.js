"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareSpreadsheet = exports.createSpreadsheet = exports.clearRange = exports.appendToSheet = exports.writeSheet = exports.readSheet = void 0;
const googleapis_1 = require("googleapis");
const auth_js_1 = require("./auth.js");
async function getSheetsService() {
    const auth = await (0, auth_js_1.getAuthClient)();
    // @ts-ignore
    return googleapis_1.google.sheets({ version: 'v4', auth });
}
const readSheet = async (spreadsheetId, range) => {
    const sheets = await getSheetsService();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });
    return res.data.values;
};
exports.readSheet = readSheet;
const writeSheet = async (spreadsheetId, range, values) => {
    const sheets = await getSheetsService();
    const res = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
    });
    return res.data;
};
exports.writeSheet = writeSheet;
const appendToSheet = async (spreadsheetId, range, values) => {
    const sheets = await getSheetsService();
    const res = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
    });
    return res.data;
};
exports.appendToSheet = appendToSheet;
const clearRange = async (spreadsheetId, range) => {
    const sheets = await getSheetsService();
    const res = await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
    });
    return res.data;
};
exports.clearRange = clearRange;
const createSpreadsheet = async (title, parentFolderId) => {
    const sheets = await getSheetsService();
    const res = await sheets.spreadsheets.create({
        requestBody: {
            properties: { title },
        },
    });
    // If a parent folder is specified, we need to move the file
    if (parentFolderId && res.data.spreadsheetId) {
        const auth = await (0, auth_js_1.getAuthClient)();
        // @ts-ignore
        const drive = googleapis_1.google.drive({ version: 'v3', auth });
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
exports.createSpreadsheet = createSpreadsheet;
const shareSpreadsheet = async (spreadsheetId, emailAddress, role) => {
    const auth = await (0, auth_js_1.getAuthClient)();
    // @ts-ignore
    const drive = googleapis_1.google.drive({ version: 'v3', auth });
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
exports.shareSpreadsheet = shareSpreadsheet;
