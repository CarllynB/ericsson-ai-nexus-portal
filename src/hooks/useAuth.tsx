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

// Helper function to decode JWT token
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

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
        
        // First decode the JWT to get user data
        const tokenData = decodeJWT(token);
        if (!tokenData) {
          throw new Error('Invalid token format');
        }
        
        console.log('🎫 Token data decoded:', { id: tokenData.id, email: tokenData.email, role: tokenData.role });
        
        // Check if backend is available
        try {
          await backendApiService.healthCheck();
          console.log('✅ Backend health check passed');
        } catch (healthError) {
          console.warn('⚠️ Backend health check failed:', healthError);
          throw new Error('Backend server is not available');
        }
        
        // Validate token by making a test API call
        const roleResponse = await backendApiService.getUserRole();
        console.log('✅ Session validation successful, role:', roleResponse.role);
        
        // Ensure role is one of the valid types
        const validRole = ['super_admin', 'admin', 'viewer'].includes(roleResponse.role) 
          ? roleResponse.role as 'super_admin' | 'admin' | 'viewer'
          : 'viewer';
        
        // Use the actual user data from the token
        const userData: User = {
          id: tokenData.id,
          email: tokenData.email,
          role: validRole,
          created_at: tokenData.created_at || new Date().toISOString(),
        };
        
        console.log('👤 Setting user data:', userData);
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
      
      // First check if backend is available
      try {
        await backendApiService.healthCheck();
        console.log('✅ Backend health check passed for login');
      } catch (healthError) {
        console.error('❌ Backend health check failed:', healthError);
        throw new Error('Cannot connect to server. Please try again later.');
      }
      
      const response = await backendApiService.login(email, password);
      
      // Ensure role is one of the valid types
      const validRole = ['super_admin', 'admin', 'viewer'].includes(response.user.role) 
        ? response.user.role as 'super_admin' | 'admin' | 'viewer'
        : 'viewer';
      
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        role: validRole,
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
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error instanceof Error) {
        if (error.message.includes('server') || error.message.includes('connect')) {
          errorMessage = 'Cannot connect to server. Please try again later.';
        } else if (error.message.includes('credentials')) {
          errorMessage = 'Invalid email or password.';
        } else {
          errorMessage = error.message;
        }
      }
      
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
      
      // First check if backend is available
      try {
        await backendApiService.healthCheck();
        console.log('✅ Backend health check passed for registration');
      } catch (healthError) {
        console.error('❌ Backend health check failed:', healthError);
        throw new Error('Cannot connect to server. Please try again later.');
      }
      
      const response = await backendApiService.register(email, password);
      
      // Ensure role is one of the valid types
      const validRole = ['super_admin', 'admin', 'viewer'].includes(response.user.role) 
        ? response.user.role as 'super_admin' | 'admin' | 'viewer'
        : 'viewer';
      
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        role: validRole,
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
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('server') || error.message.includes('connect')) {
          errorMessage = 'Cannot connect to server. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }
      
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
