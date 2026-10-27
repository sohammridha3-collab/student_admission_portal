import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  {
    role: 'ADMIN',
    label: 'Eleanor Vance (Chief Admin)',
    email: 'admin@admission.edu',
    password: 'Admin@123',
    badge: 'Admin Panel',
    color: 'bg-indigo-600'
  },
  {
    role: 'OFFICER',
    label: 'Dr. Sarah Jenkins (Senior)',
    email: 'officer@admission.edu',
    password: 'Officer@123',
    badge: 'Full Decision Authority',
    color: 'bg-blue-600'
  },
  {
    role: 'OFFICER',
    label: 'James Wilson (Reviewer)',
    email: 'officer2@admission.edu',
    password: 'Officer@123',
    badge: 'Restricted Reviewer',
    color: 'bg-sky-600'
  },
  {
    role: 'STUDENT',
    label: 'Alice Morgan',
    email: 'alice@student.edu',
    password: 'Student@123',
    badge: 'Submitted (Queued)',
    color: 'bg-blue-500'
  },
  {
    role: 'STUDENT',
    label: 'Bob Davis',
    email: 'bob@student.edu',
    password: 'Student@123',
    badge: 'Accepted (Offer Letter)',
    color: 'bg-emerald-600'
  },
  {
    role: 'STUDENT',
    label: 'Charlie Parker',
    email: 'charlie@student.edu',
    password: 'Student@123',
    badge: 'Draft (In-Progress)',
    color: 'bg-slate-600'
  },
  {
    role: 'STUDENT',
    label: 'Diana Prince',
    email: 'diana@student.edu',
    password: 'Student@123',
    badge: 'Docs Verified (Testing)',
    color: 'bg-purple-600'
  },
  {
    role: 'STUDENT',
    label: 'Evan Wright',
    email: 'evan@student.edu',
    password: 'Student@123',
    badge: 'Declined (Below Score)',
    color: 'bg-rose-600'
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('admission_portal_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (error) {
          console.error('Session expired or invalid:', error);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password, requestedRole) => {
    const data = await api.login({ email, password, requestedRole });
    localStorage.setItem('admission_portal_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await api.register({ name, email, password });
    localStorage.setItem('admission_portal_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('admission_portal_token');
    setToken(null);
    setUser(null);
  };

  const loginAsDemo = async (demoAccount) => {
    return await login(demoAccount.email, demoAccount.password);
  };

  const refreshUser = async () => {
    if (token) {
      const res = await api.getMe();
      setUser(res.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        loginAsDemo,
        refreshUser,
        isAuthenticated: !!user,
        role: user ? user.role : null,
        permissions: user ? user.permissions || {} : {}
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
