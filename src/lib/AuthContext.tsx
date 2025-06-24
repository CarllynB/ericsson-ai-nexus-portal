
import React, { createContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  roles?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isAdmin: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Mock user with admin roles for demo
  const [user, setUser] = useState<User | null>({
    id: '1',
    email: 'admin@example.com',
    isAdmin: true,
    roles: ['admin', 'super_admin'] // For demo - will come from Flask backend
  });

  const login = async (email: string, password: string) => {
    try {
      // This will be replaced with actual Flask API call
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store JWT in localStorage
        localStorage.setItem('token', data.access_token);
        setUser({
          id: data.user.id,
          email: data.user.email,
          isAdmin: data.user.roles?.includes('admin') || false,
          roles: data.user.roles || []
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Fallback for demo
      setUser({
        id: '1',
        email,
        isAdmin: email.includes('admin'),
        roles: email.includes('admin') ? ['admin'] : []
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin: user?.isAdmin || false
    }}>
      {children}
    </AuthContext.Provider>
  );
};
