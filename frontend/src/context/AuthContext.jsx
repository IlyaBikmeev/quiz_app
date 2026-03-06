import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiJson, setOnUnauthorized } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem('authToken'));
  const [valid, setValid] = useState(null);

  const setToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem('authToken', newToken);
      setTokenState(newToken);
      setValid(true);
    } else {
      localStorage.removeItem('authToken');
      setTokenState(null);
      setValid(false);
    }
  }, []);

  const checkValid = useCallback(async () => {
    if (!token) {
      setValid(false);
      return false;
    }
    try {
      const data = await apiJson('/auth/validate-token');
      setValid(data?.valid === true);
      return data?.valid === true;
    } catch {
      setValid(false);
      setToken(null);
      return false;
    }
  }, [token, setToken]);

  useEffect(() => {
    setOnUnauthorized(() => setToken(null));
  }, [setToken]);

  useEffect(() => {
    if (token) {
      checkValid();
    } else {
      setValid(false);
    }
  }, [token, checkValid]);

  const value = {
    token,
    setToken,
    valid: valid === true,
    validUnknown: valid === null,
    checkValid,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
