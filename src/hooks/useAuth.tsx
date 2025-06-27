
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';

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
      
      // Simple offline authentication - in a real app you'd want proper security
      if (email && password === 'admin123') {
        const role = SUPER_ADMINS.includes(email) ? 'super_admin' : 'admin';
        const userData: User = {
          id: email.replace('@', '_').replace('.', '_'),
          email,
          role,
          created_at: new Date().toISOString(),
        };
        
        setUser(userData);
        localStorage.setItem('offline_user', JSON.stringify(userData));
        
        toast({
          title: "Success",
          description: "Logged in successfully (offline mode)"
        });
      } else {
        throw new Error('Invalid credentials. Use password: admin123');
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
      // In offline mode, we can't actually change the password
      // but we'll simulate success for demo purposes
      toast({
        title: "Info",
        description: "Password change not available in offline mode"
      });
      return true;
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive"
      });
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
