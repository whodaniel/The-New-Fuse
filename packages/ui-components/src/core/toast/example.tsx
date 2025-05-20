import React from 'react';
import { ToastProvider, useToast, Toaster } from './index.js';
import { Button } from '../button/index.js';

/**
 * Example component demonstrating toast usage
 */
function ToastExample() {
  const { toast } = useToast();

  const showDefaultToast = () => {
    toast({
      title: 'Default Toast',
      description: 'This is a default toast message',
      variant: 'default',
    });
  };

  const showSuccessToast = () => {
    toast({
      title: 'Success',
      description: 'Operation completed successfully',
      variant: 'success',
    });
  };

  const showInfoToast = () => {
    toast({
      title: 'Information',
      description: 'Here is some important information',
      variant: 'info',
    });
  };

  const showWarningToast = () => {
    toast({
      title: 'Warning',
      description: 'This action might have consequences',
      variant: 'warning',
    });
  };

  const showErrorToast = () => {
    toast({
      title: 'Error',
      description: 'Something went wrong',
      variant: 'destructive',
    });
  };

  const showPersistentToast = () => {
    toast({
      title: 'Persistent Toast',
      description: 'This toast will not auto-dismiss',
      variant: 'info',
      duration: 0, // Won't auto-dismiss
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Toast Examples</h1>
      <div className="flex flex-wrap gap-2">
        <Button onClick={showDefaultToast}>Default Toast</Button>
        <Button onClick={showSuccessToast} variant="primary">Success Toast</Button>
        <Button onClick={showInfoToast} variant="secondary">Info Toast</Button>
        <Button onClick={showWarningToast} variant="outline">Warning Toast</Button>
        <Button onClick={showErrorToast} variant="destructive">Error Toast</Button>
        <Button onClick={showPersistentToast} variant="ghost">Persistent Toast</Button>
      </div>
    </div>
  );
}

/**
 * Wrapper component with ToastProvider
 */
export function ToastExampleWithProvider() {
  return (
    <ToastProvider>
      <ToastExample />
      <Toaster position="bottom-right" />
    </ToastProvider>
  );
}

export default ToastExampleWithProvider;
