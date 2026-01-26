import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, Copy, Eye, EyeOff, Key, Save, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface ApiKeyInputProps {
  provider: string;
  icon?: React.ReactNode;
  value?: string;
  placeholder?: string;
  onSave: (value: string) => void;
  onDelete?: () => void;
  isSaved?: boolean;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  provider,
  icon,
  value = '',
  placeholder,
  onSave,
  onDelete,
  isSaved = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(inputValue);
    setHasCopied(true);
    toast.success('API Key copied to clipboard');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleSave = () => {
    onSave(inputValue);
    toast.success(`${provider} API Key saved successfully`);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      setInputValue('');
      toast.success(`${provider} API Key removed`);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-all hover:shadow-md">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
          {icon || <Key className="w-5 h-5 text-slate-500" />}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-slate-900 dark:text-white">{provider}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isSaved ? 'Key is configured' : 'Not configured'}
          </p>
        </div>
        {isSaved && (
          <div className="flex items-center gap-1">
            <span className="flex items-center px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium rounded-full">
              <Check className="w-3 h-3 mr-1" />
              Active
            </span>
          </div>
        )}
      </div>

      <div className="relative flex items-center gap-2">
        <div className="relative flex-1 group">
          <Input
            type={isVisible ? 'text' : 'password'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder || `Enter your ${provider} API Key`}
            className={cn(
              'pr-20 transition-all font-mono text-sm',
              isSaved ? 'border-green-500/50 focus-visible:ring-green-500/20' : ''
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            tabIndex={-1}
            title={isVisible ? 'Hide API Key' : 'Show API Key'}
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex gap-2">
          {/* Save Button - Shows if changed or empty */}
          {inputValue !== value || !isSaved ? (
            <Button
              onClick={handleSave}
              size="sm"
              disabled={!inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          ) : (
            <>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="icon"
                className="h-10 w-10 text-slate-500 hover:text-slate-700"
                title="Copy API Key"
              >
                {hasCopied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>

              {onDelete && (
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200"
                  title="Remove API Key"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
