"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthClient = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const googleapis_1 = require("googleapis");
// Load credentials from file manually to control formatting
const keyFilePath = path_1.default.join(__dirname, '../credentials.json');
const getAuthClient = async () => {
    const content = fs_1.default.readFileSync(keyFilePath, 'utf-8');
    const credentials = JSON.parse(content);
    const auth = new googleapis_1.google.auth.GoogleAuth({
        credentials,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive',
        ],
    });
    return await auth.getClient();
};
exports.getAuthClient = getAuthClient;
