// Export shared hooks
import { useState } from 'react';

// Re-export hooks from the hooks package
// Temporarily comment out to avoid circular dependencies
// export * from '@the-new-fuse/hooks';

// Add any additional shared hooks here
export const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T) => void] => {
  // This is a simple implementation of a localStorage hook
  // In a real application, you would want to add more error handling and type safety

  // Initialize state with value from localStorage or initialValue
  const storedValue = typeof window !== 'undefined'
    ? window.localStorage.getItem(key)
    : null;

  const initial = storedValue
    ? JSON.parse(storedValue)
    : initialValue;

  // State to store our value
  const [value, setValue] = useState<T>(initial);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setStoredValue = (newValue: T): any => {
    // Save state
    setValue(newValue);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(newValue));
    }
  };

  return [value, setStoredValue];
};
