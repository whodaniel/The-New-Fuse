export {}
exports.saveFile = saveFile;
exports.validateFile = validateFile;
import promises_1 from 'fs/promises';
import path_1 from 'path';
import crypto_1 from 'crypto';
const UPLOAD_DIR = path_1.default.join(process.cwd(), 'public', 'uploads');
async function ensureUploadDir(): any {
    try {
        await (0, promises_1.mkdir)(UPLOAD_DIR, { recursive: true });
    }
    catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}
async function saveFile(file): any {
    await ensureUploadDir();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtension = path_1.default.extname(file.name);
    const fileName = `${crypto_1.default.randomBytes(16).toString('hex')}${fileExtension}`;
    const filePath = path_1.default.join(UPLOAD_DIR, fileName);
    await (0, promises_1.writeFile)(filePath, buffer);
    return `/uploads/${fileName}`;
}
function validateFile(file): any {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'audio/mpeg',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (file.size > maxSize) {
        throw new Error(`File size exceeds limit (${Math.floor(maxSize / 1024 / 1024)}MB)`);
    }
    if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not supported');
    }
}
export {};
//# sourceMappingURL=uploadHandler.js.map