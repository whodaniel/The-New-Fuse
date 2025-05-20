import { useState, useEffect } from 'react';
import { userFromStorage } from '@/utils/request';

interface User {
  uid: string;
  email?: string;
  username?: string;
  role?: string;
  profileImage?: string;
  settings?: {
    [key: string]: any;
  };
}

interface UseUserReturn {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  isAuthenticated: boolean;
}

export default function useUser(): UseUserReturn {
  const [user, setInternalUser] = useState<User | null>(() => userFromStorage());

  const setUser = (newUser: User | null): any => {
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    }
    setInternalUser(newUser);
  };

  const clearUser = (): any => {
    localStorage.removeItem('user');
    setInternalUser(null);
  };

  useEffect(() => {
    const storedUser = userFromStorage();
    if (storedUser && (!user || user.uid !== storedUser.uid)) {
      setInternalUser(storedUser);
    }
  }, []);

  return {
    user,
    setUser,
    clearUser,
    isAuthenticated: !!user
  };
}
//# sourceMappingURL=useUser.js.map