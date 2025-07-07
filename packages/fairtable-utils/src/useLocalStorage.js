import { useState, useEffect } from 'react';
function useLocalStorage(key, initialValue) {
    const getStoredValue = () => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        }
        catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    };
    const [storedValue, setStoredValue] = useState(getStoredValue);
    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        }
        catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);
    return [storedValue, setStoredValue];
}
export default useLocalStorage;
//# sourceMappingURL=useLocalStorage.js.map