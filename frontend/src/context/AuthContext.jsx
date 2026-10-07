import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMeApi, loginApi, registerApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('credify_token');
      if (token) {
        try {
          const res = await getMeApi();
          setUser(res.data);
        } catch (err) {
          console.error("Session expired or invalid token:", err);
          localStorage.removeItem('credify_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (credentials) => {
    const res = await loginApi(credentials);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('credify_token', access_token);
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const res = await registerApi(data);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('credify_token', access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('credify_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
