import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/shared/ui/core/Card';
import { Button } from '@/shared/ui/core/Button';
import { Progress } from '@/shared/ui/core/Progress';
import { cn } from '@/lib/utils';
export function FileUpload({ onUpload, maxSize = 10 * 1024 * 1024, acceptedTypes = {
    'image/*': [],
    'application/pdf': [],
    'text/*': []
}, multiple = true, maxFiles = 5, className }) {
    const [uploadingFiles, setUploadingFiles] = React.useState([]);
    const [isUploading, setIsUploading] = React.useState(false);
    const onDrop = React.useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0)
            return;
        const newFiles = acceptedFiles.map(fil(e: any) => ({
            file,
            progress: 0
        }));
        setUploadingFiles((prev: any) => [...prev, ...newFiles]);
        setIsUploading(true);
        try {
            await onUpload(acceptedFiles);
            setUploadingFiles((prev: any) => prev.map(f => (Object.assign(Object.assign({}, f), { progress: 100 }))));
        }
        catch (error) {
            setUploadingFiles((prev: any) => prev.map(f => (Object.assign(Object.assign({}, f), { error: 'Upload failed' }))));
        }
        finally {
            setIsUploading(false);
        }
    }, [onUpload]);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize,
        accept: acceptedTypes,
        multiple,
        maxFiles
    });
    const removeFile = (index) => {
        setUploadingFiles((prev: any) => prev.filter((_, i) => i !== index));
    };
    const formatFileSize = (bytes) => {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    return (<Card className={cn("w-full", className)}>
      <div className="p-6">
        <div {...getRootProps()} className={cn("border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200", isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary/50")}>
          <input {...getInputProps()}/>
          
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
            </div>

            {isDragActive ? (<p className="text-primary font-medium">Drop the files here...</p>) : (<div className="space-y-2">
                <p className="text-gray-600">
                  Drag and drop files here, or click to select files
                </p>
                <p className="text-sm text-gray-500">
                  Maximum file size: {formatFileSize(maxSize)}
                </p>
                <p className="text-sm text-gray-500">
                  Accepted types: {Object.keys(acceptedTypes).join(', ')}
                </p>
              </div>)}
          </div>
        </div>

        {uploadingFiles.length > 0 && (<div className="mt-6 space-y-4">
            {uploadingFiles.map((file, index) => (<div key={file.file.name + index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.file.size)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)} className="ml-2">
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </Button>
                  </div>
                  
                  <div className="mt-2">
                    {file.error ? (<p className="text-sm text-red-600">{file.error}</p>) : (<Progress value={file.progress} className="h-1"/>)}
                  </div>
                </div>
              </div>))}
          </div>)}
      </div>
    </Card>);
}
//# sourceMappingURL=FileUpload.js.map