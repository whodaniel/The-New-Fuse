import { cn } from '@/lib/utils';
import { File, FileText, Image, X } from 'lucide-react';
import React from 'react';

interface AttachItemProps {
  id: string;
  name: string;
  size: number;
  type: string;
  onRemove?: (id: string) => void;
  className?: string;
}

const AttachItem: React.FC<AttachItemProps> = ({ id, name, size, type, onRemove, className }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    if (type === 'application/pdf') {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 rounded">{getFileIcon()}</div>
        <div>
          <p className="text-sm font-medium text-slate-900 truncate max-w-48">{name}</p>
          <p className="text-xs text-slate-500">
            {formatFileSize(size)} • {type}
          </p>
        </div>
      </div>

      <button
        onClick={() => onRemove?.(id)}
        className="p-1.5 hover:bg-slate-200 rounded-md transition-colors"
        title="Remove attachment"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AttachItem;
