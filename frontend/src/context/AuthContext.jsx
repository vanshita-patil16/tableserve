import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tableserve_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('tableserve_token') || null;
  });

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to login');

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('tableserve_user', JSON.stringify(data.user));
    localStorage.setItem('tableserve_token', data.token);
    return data;
  };

  const register = async (name, email, password, role = 'CUSTOMER') => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register');

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('tableserve_user', JSON.stringify(data.user));
    localStorage.setItem('tableserve_token', data.token);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('tableserve_user');
    localStorage.removeItem('tableserve_token');
  };

  // Quick switcher for presentation / professor demonstration
  const switchDemoUser = async (role) => {
    if (role === 'ADMIN') {
      return login('admin@tableserve.com', 'Admin@123');
    } else {
      return login('john.doe@example.com', 'Customer@123');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, switchDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
