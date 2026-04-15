import React, { useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File;
}

interface AttachmentsProps {
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

const Attachments: React.FC<AttachmentsProps> = ({ 
  attachments = [],
  onAttachmentsChange,
  maxSize = 10,
  acceptedTypes = ['image/*', 'text/*', 'application/pdf'],
  className 
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newAttachments: Attachment[] = Array.from(files)
      .filter(file => {
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB`);
          return false;
        }
        
        // Check file type
        const accepted = acceptedTypes.some(type => {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.slice(0, -1));
          }
          return file.type === type;
        });
        
        if (!accepted) {
          alert(`File type ${file.type} is not supported`);
          return false;
        }
        
        return true;
      })
      .map(file => ({
        id: Math.random().toString(36).substring(2, 15),
        name: file.name,
        size: file.size,
        type: file.type,
        file
      }));

    if (onAttachmentsChange) {
      onAttachmentsChange([...attachments, ...newAttachments]);
    }
  };

  const removeAttachment = (id: string) => {
    if (onAttachmentsChange) {
      onAttachmentsChange(attachments.filter(att => att.id !== id));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className={cn("relative", className)}>
      <input
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        id="file-upload"
      />
      
      <label
        htmlFor="file-upload"
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer",
          "bg-slate-100 hover:bg-slate-200 rounded-md transition-colors",
          isDragging && "bg-blue-100 border-2 border-dashed border-blue-300"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Paperclip className="w-4 h-4" />
        <span>Attach</span>
      </label>

      {attachments.length > 0 && (
        <div className="mt-2 space-y-2">
          {attachments.map(attachment => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-2 bg-slate-50 rounded-md"
            >
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium">{attachment.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(attachment.size)}</p>
                </div>
              </div>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Attachments;