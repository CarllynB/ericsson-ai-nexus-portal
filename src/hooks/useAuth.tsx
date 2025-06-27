
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

  // Only Muhammad and Carllyn are super admins
  const SUPER_ADMINS = ['muhammad.mahmood@ericsson.com', 'carllyn.barfi@ericsson.com'];

  useEffect(() => {
    // Check localStorage for existing user session
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
      
      // Check if user has assigned role in localStorage
      const assignedRoles = JSON.parse(localStorage.getItem('user_roles') || '{}');
      const userRole = assignedRoles[email];
      
      // Super admins can use admin123, others need to create accounts
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
      } else if (userRole && password.length >= 6) {
        // User has assigned role and created proper account
        const userData: User = {
          id: email.replace('@', '_').replace('.', '_'),
          email,
          role: userRole,
          created_at: new Date().toISOString(),
        };
        
        setUser(userData);
        localStorage.setItem('offline_user', JSON.stringify(userData));
        
        toast({
          title: "Success",
          description: "Logged in successfully"
        });
      } else {
        throw new Error('Invalid credentials or account not found');
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
