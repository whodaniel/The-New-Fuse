export {}
exports.config = void 0;
exports.POST = POST;
import server_1 from 'next/server';
import uploadHandler_1 from '../../../lib/uploadHandler.js';
async function POST(request): any {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) {
            return server_1.NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }
        try {
            (0, uploadHandler_1.validateFile)(file);
        }
        catch (error) {
            return server_1.NextResponse.json({ error: error.message }, { status: 400 });
        }
        const fileUrl = await (0, uploadHandler_1.saveFile)(file);
        return server_1.NextResponse.json({ url: fileUrl });
    }
    catch (error) {
        console.error('Error uploading file:', error);
        return server_1.NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
exports.config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb'
        }
    }
};
export {};
//# sourceMappingURL=route.js.map