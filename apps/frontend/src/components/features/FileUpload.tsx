Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUpload = void 0;
import react_1 from 'react';
import react_dropzone_1 from 'react-dropzone';
import Button_1 from '../../../core/Button.js';
import react_hot_toast_1 from 'react-hot-toast';
import websocket_1 from '../../../../services/websocket.js';
const FileUpload = ({ onUploadComplete, disabled }) => {
    const onDrop = (0, react_1.useCallback)(async (acceptedFiles) => {
        try {
            for (const file of acceptedFiles) {
                if (file.size > 10 * 1024 * 1024) {
                    react_hot_toast_1.toast.error(`File ${file.name} is too large. Maximum size is 10MB`);
                    continue;
                }
                await websocket_1.default.uploadFile(file, {
                    type: 'chat_attachment',
                    timestamp: new Date().toISOString(),
                });
                onUploadComplete === null || onUploadComplete === void 0 ? void 0 : onUploadComplete({
                    id: Math.random().toString(36).substring(7),
                    url: URL.createObjectURL(file),
                    name: file.name,
                });
            }
        }
        catch (error) {
            console.error('File upload error:', error);
            react_hot_toast_1.toast.error('Failed to upload file');
        }
    }, [onUploadComplete]);
    const { getRootProps, getInputProps, isDragActive } = (0, react_dropzone_1.useDropzone)({
        onDrop,
        disabled,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
            'application/pdf': ['.pdf'],
            'text/*': ['.txt', '.md'],
            'application/json': ['.json'],
        },
        maxFiles: 5,
    });
    return (<div {...getRootProps()} className={`
        border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
        transition-colors duration-200 ease-in-out
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
      `}>
      <input {...getInputProps()}/>
      <div className="space-y-2">
        <div className="text-sm text-gray-600">
          {isDragActive ? (<p>Drop the files here ...</p>) : (<p>Drag & drop files here, or click to select files</p>)}
        </div>
        <div className="text-xs text-gray-500">
          Supported files: Images, PDF, Text, JSON (Max 10MB)
        </div>
        <Button_1.Button type="button" variant="outline" size="sm" disabled={disabled} onClick={(e) => e.stopPropagation()}>
          Select Files
        </Button_1.Button>
      </div>
    </div>);
};
exports.FileUpload = FileUpload;
exports.default = exports.FileUpload;
export {};
//# sourceMappingURL=FileUpload.js.map