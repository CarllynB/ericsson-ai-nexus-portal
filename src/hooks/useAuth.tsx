
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Initialize app (populate agents if needed)
  useInitializeApp();

  // Dispatch custom event when auth state changes
  const dispatchAuthChange = () => {
    window.dispatchEvent(new CustomEvent('authChange'));
  };

  // Validate stored session on mount
  useEffect(() => {
    const validateStoredSession = async () => {
      console.log('🔄 Validating stored session...');
      setLoading(true);
      
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        console.log('ℹ️ No stored token found');
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Validating token with backend...');
        
        // Validate token by making a test API call
        const roleResponse = await backendApiService.getUserRole();
        console.log('✅ Session validation successful, role:', roleResponse.role);
        
        // If we got here, the token is valid. Get user data from token
        // For now we'll create a basic user object - in a real app this would come from the backend
        const userData: User = {
          id: 'current-user-id',
          email: 'current-user-email', // This should come from backend
          role: roleResponse.role,
          created_at: new Date().toISOString(),
        };
        
        setUser(userData);
        dispatchAuthChange();
      } catch (error) {
        console.warn('⚠️ Stored session invalid, clearing:', error);
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    validateStoredSession();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔑 Attempting login for:', email);
      setLoading(true);
      
      const response = await backendApiService.login(email, password);
      
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
        created_at: response.user.created_at,
      };
      
      setUser(userData);
      dispatchAuthChange();
      
      console.log('✅ Login successful:', userData.role);
      toast({
        title: "Success",
        description: `Logged in successfully as ${response.user.role}`
      });
    } catch (error) {
      console.error('❌ Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    try {
      console.log('📝 Attempting registration for:', email);
      setLoading(true);
      
      const response = await backendApiService.register(email, password);
      
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
        created_at: response.user.created_at,
      };
      
      setUser(userData);
      dispatchAuthChange();
      
      console.log('✅ Registration successful:', userData.role);
      toast({
        title: "Success",
        description: `Account created successfully with ${response.user.role} role`
      });
    } catch (error) {
      console.error('❌ Registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Logging out...');
      backendApiService.logout();
      setUser(null);
      dispatchAuthChange();
      
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      console.log('🔒 Changing password for:', user.email);
      await backendApiService.changePassword(user.email, newPassword);
      
      toast({
        title: "Success",
        description: "Password changed successfully"
      });
      
      return true;
    } catch (error) {
      console.error('❌ Password change error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      toast({
        title: "Error",
        description: errorMessage,
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
