import { useToast as useChakraToast } from '@chakra-ui/react';

interface ToastOptions {
  title?: string;
  description?: string;
  status?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  isClosable?: boolean;
}

export function useToast() {
  const toast = useChakraToast();

  const showToast = ({
    title,
    description,
    status = 'info',
    duration = 5000,
    isClosable = true,
  }: ToastOptions) => {
    toast({
      title,
      description,
      status,
      duration,
      isClosable,
      position: 'top',
    });
  };

  return {
    showToast,
    success: (title: string, description?: string) =>
      showToast({ title, description, status: 'success' }),
    error: (title: string, description?: string) =>
      showToast({ title, description, status: 'error' }),
    warning: (title: string, description?: string) =>
      showToast({ title, description, status: 'warning' }),
    info: (title: string, description?: string) =>
      showToast({ title, description, status: 'info' }),
  };
}