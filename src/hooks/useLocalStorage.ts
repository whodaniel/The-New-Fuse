import { useState, useEffect, useCallback } from 'react';

// Define a generic type for the parser and stringifier
type Parser<T> = (value: string) => T;
type Stringifier<T> = (value: T) => string;

interface UseLocalStorageOptions<T> {
  serializer?: Stringifier<T>;
  deserializer?: Parser<T>;
  validator?: (storedValue: any) => storedValue is T; // Validator to check type/structure
}

/**
 * Custom hook to manage state with localStorage.
 *
 * @param key The key to use in localStorage.
 * @param initialValue The initial value if nothing is stored or if stored value is invalid.
 * @param options Optional: serializer, deserializer, and validator.
 * @returns A stateful value, and a function to update it.
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>
): [T, (value: T | ((val: T) => T)) => void] {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    validator,
  } = options || {};

  // Get from local storage then parse stored json or return initialValue
  const readValue = useCallback((): T => {
    // Prevent build error "window is undefined" during SSR/SSG
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      const parsedItem = deserializer(item);
      // If a validator is provided, use it. Otherwise, assume the deserialized item is correct.
      if (validator) {
        return validator(parsedItem) ? parsedItem : initialValue;
      }
      return parsedItem;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [key, initialValue, deserializer, validator]);

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      // Prevent build error "window is undefined" but keeps working
      if (typeof window === 'undefined') {
        console.warn(
          `Tried to set localStorage key “${key}” even though no window was found`
        );
      }

      try {
        // Allow value to be a function so we have same API as useState
        const newValue = value instanceof Function ? value(storedValue) : value;
        // Save to local storage
        window.localStorage.setItem(key, serializer(newValue));
        // Save state
        setStoredValue(newValue);
        // We dispatch a custom event so every useLocalStorage hook are notified
        window.dispatchEvent(new StorageEvent('local-storage', { key }));
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, serializer, storedValue] // Include storedValue in dependencies for the function variant of setValue
  );

  // Listen to storage events to sync changes across tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key || (event.type === 'local-storage' && (event as any).key === key)) {
        const newValue = readValue();
        if (JSON.stringify(newValue) !== JSON.stringify(storedValue)) { // Avoid unnecessary re-renders
            setStoredValue(newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleStorageChange as EventListener); // For our custom event

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange as EventListener);
    };
  }, [key, readValue, storedValue]); // Add storedValue to dependencies

  // Re-read value if key, initialValue, deserializer, or validator changes (though less common for these to change)
  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);


  return [storedValue, setValue];
}

export default useLocalStorage;