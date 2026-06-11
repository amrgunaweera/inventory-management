import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';

const AuthContext = createContext(null);

const DEMO_USER = {
  id: 'user-1',
  name: 'Alex Morgan',
  email: 'alex@stocksense.app',
  role: 'admin',
  avatar: 'AM',
  store: 'The Niche Shop',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = storage.get('auth_user');
    if (saved) setUser(saved);
    setLoading(false);
  }, []);

  const login = (email, password) => {
    if (email === 'demo@stocksense.app' && password === 'demo1234') {
      storage.set('auth_user', DEMO_USER);
      setUser(DEMO_USER);
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials. Use demo@stocksense.app / demo1234' };
  };

  const logout = () => {
    storage.remove('auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
