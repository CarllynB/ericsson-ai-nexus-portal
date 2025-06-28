
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useInitializeApp } from '@/hooks/useInitializeApp';
import { backendApiService } from '@/services/backendApi';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
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

  // Dispatch custom event when auth state changes
  const dispatchAuthChange = () => {
    window.dispatchEvent(new CustomEvent('authChange'));
  };

  useEffect(() => {
    // Check localStorage for existing user session
    const savedUser = localStorage.getItem('current_user');
    const token = localStorage.getItem('auth_token');
    
    if (savedUser && token) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        dispatchAuthChange();
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('current_user');
        localStorage.removeItem('auth_token');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('Attempting login for:', email);
      setLoading(true);
      
      const response = await backendApiService.login(email, password);
      
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
        created_at: response.user.created_at,
      };
      
      setUser(userData);
      localStorage.setItem('current_user', JSON.stringify(userData));
      dispatchAuthChange();
      
      toast({
        title: "Success",
        description: `Logged in successfully as ${response.user.role}`
      });
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

  const register = async (email: string, password: string): Promise<void> => {
    try {
      console.log('Attempting registration for:', email);
      setLoading(true);
      
      const response = await backendApiService.register(email, password);
      
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
        created_at: response.user.created_at,
      };
      
      setUser(userData);
      localStorage.setItem('current_user', JSON.stringify(userData));
      dispatchAuthChange();
      
      toast({
        title: "Success",
        description: `Account created successfully with ${response.user.role} role`
      });
    } catch (error) {
      console.error('Registration failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Registration failed',
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
      backendApiService.logout();
      setUser(null);
      dispatchAuthChange();
      
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
      if (!user) {
        throw new Error('No user logged in');
      }

      await backendApiService.changePassword(user.email, newPassword);
      
      toast({
        title: "Success",
        description: "Password changed successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to change password',
        variant: "destructive"
      });
      return false;
    }
  };

  const contextValue: AuthContextType = {
    user,
    login,
    register,
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
