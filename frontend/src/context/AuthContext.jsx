import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminLogin } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nuaits_admin_token');
    const data  = localStorage.getItem('nuaits_admin_data');
    if (token && data) setAdmin(JSON.parse(data));
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data } = await adminLogin({ username, password });
    if (data.success) {
      localStorage.setItem('nuaits_admin_token', data.token);
      localStorage.setItem('nuaits_admin_data', JSON.stringify(data.admin));
      setAdmin(data.admin);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('nuaits_admin_token');
    localStorage.removeItem('nuaits_admin_data');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
