import { useCallback } from 'react';

export const useToast = () => {
  const toast = useCallback(({ title, description, status }) => {
    console.log(`[Toast] ${status}: ${title} - ${description}`);
    // In a real app, this would show an actual toast notification
  }, []);

  return toast;
};

export default useToast;
