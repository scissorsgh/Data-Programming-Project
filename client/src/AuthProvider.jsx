import { useEffect, useState } from 'react';
import AuthContext from './AuthContext';
import { api } from './api';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  async function refreshUser() {
    try {
      const data = await api('/users/me');
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    try {
      await api('/users/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }

  useEffect(() => {
    let active = true;

    api('/users/me')
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, authLoading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
