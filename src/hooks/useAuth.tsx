
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { useInitializeApp } from '@/hooks/useInitializeApp';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  changePassword: (newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Initialize app (populate agents if needed)
  useInitializeApp();

  // Default super admin users for offline mode
  const SUPER_ADMINS = ['muhammad.mahmood@ericsson.com', 'carllyn.barfi@ericsson.com'];

  useEffect(() => {
    // In offline mode, check localStorage for existing user session
    const savedUser = localStorage.getItem('offline_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('offline_user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('Attempting offline login for:', email);
      setLoading(true);
      
      // Check if it's a super admin with the default password
      if (SUPER_ADMINS.includes(email) && password === 'admin123') {
        const userData: User = {
          id: email.replace('@', '_').replace('.', '_'),
          email,
          role: 'super_admin',
          created_at: new Date().toISOString(),
        };
        
        setUser(userData);
        localStorage.setItem('offline_user', JSON.stringify(userData));
        
        toast({
          title: "Success",
          description: "Logged in successfully"
        });
      } else {
        // For other users, check if they have an account in localStorage roles
        const existingRoles = JSON.parse(localStorage.getItem('user_roles') || '{}');
        if (existingRoles[email]) {
          const userData: User = {
            id: email.replace('@', '_').replace('.', '_'),
            email,
            role: existingRoles[email],
            created_at: new Date().toISOString(),
          };
          
          setUser(userData);
          localStorage.setItem('offline_user', JSON.stringify(userData));
          
          toast({
            title: "Success",
            description: "Logged in successfully"
          });
        } else {
          // New user - create as viewer
          const userData: User = {
            id: email.replace('@', '_').replace('.', '_'),
            email,
            role: 'viewer',
            created_at: new Date().toISOString(),
          };
          
          // Save the new user role
          existingRoles[email] = 'viewer';
          localStorage.setItem('user_roles', JSON.stringify(existingRoles));
          
          setUser(userData);
          localStorage.setItem('offline_user', JSON.stringify(userData));
          
          toast({
            title: "Success",
            description: "Account created successfully"
          });
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Login failed',
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('Logging out...');
      setUser(null);
      localStorage.removeItem('offline_user');
      
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    try {
      // In offline mode, we don't actually change passwords
      // This is just for compatibility - no toast needed
      return true;
    } catch (error) {
      console.error('Password change error:', error);
      return false;
    }
  };

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin',
    changePassword,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
