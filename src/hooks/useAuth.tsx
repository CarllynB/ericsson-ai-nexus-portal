
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useInitializeApp } from '@/hooks/useInitializeApp';

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

  // Default super admin users - Fixed email addresses
  const SUPER_ADMINS = ['muhammad.mahmood@ericsson.com', 'carllyn.barfi@ericsson.com'];

  // Dispatch custom event when auth state changes
  const dispatchAuthChange = () => {
    window.dispatchEvent(new CustomEvent('authChange'));
  };

  useEffect(() => {
    // Check localStorage for existing user session
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        dispatchAuthChange();
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('current_user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('Attempting login for:', email);
      setLoading(true);
      
      // Check if it's a super admin
      if (SUPER_ADMINS.includes(email)) {
        // Check for custom password first
        const savedPassword = localStorage.getItem(`password_${email}`);
        const correctPassword = savedPassword || 'admin123';
        
        if (password === correctPassword) {
          const userData: User = {
            id: email.replace('@', '_').replace('.', '_'),
            email,
            role: 'super_admin',
            created_at: new Date().toISOString(),
          };
          
          setUser(userData);
          localStorage.setItem('current_user', JSON.stringify(userData));
          dispatchAuthChange();
          
          toast({
            title: "Success",
            description: "Logged in successfully"
          });
        } else {
          throw new Error('Invalid password');
        }
      } else {
        // For other users, check if they have a password set
        const savedPassword = localStorage.getItem(`password_${email}`);
        
        if (savedPassword) {
          // User exists, check password
          if (password === savedPassword) {
            // Get user role from SQLite - this is the key fix
            const { sqliteService } = await import('@/services/sqlite');
            await sqliteService.initialize();
            
            let role = await sqliteService.getUserRole(email);
            
            if (!role) {
              // If no role assigned, default to viewer and create the role
              role = 'viewer';
              await sqliteService.createUserRole(email, 'viewer');
            }
            
            const userData: User = {
              id: email.replace('@', '_').replace('.', '_'),
              email,
              role: role as 'super_admin' | 'admin' | 'viewer',
              created_at: new Date().toISOString(),
            };
            
            setUser(userData);
            localStorage.setItem('current_user', JSON.stringify(userData));
            dispatchAuthChange();
            
            toast({
              title: "Success",
              description: `Logged in successfully as ${role}`
            });
          } else {
            throw new Error('Invalid password');
          }
        } else {
          throw new Error('Account not found. Please create an account first.');
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

  const register = async (email: string, password: string): Promise<void> => {
    try {
      console.log('Attempting registration for:', email);
      setLoading(true);
      
      // Check if user already exists
      const existingPassword = localStorage.getItem(`password_${email}`);
      if (existingPassword) {
        throw new Error('Account already exists. Please sign in instead.');
      }
      
      // Validate password
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Create new user account
      localStorage.setItem(`password_${email}`, password);
      
      // Check if there's already a role assigned for this email
      const { sqliteService } = await import('@/services/sqlite');
      await sqliteService.initialize();
      
      let role = await sqliteService.getUserRole(email);
      
      if (!role) {
        // If no role was pre-assigned, default to viewer
        role = 'viewer';
        await sqliteService.createUserRole(email, 'viewer');
      }
      
      const userData: User = {
        id: email.replace('@', '_').replace('.', '_'),
        email,
        role: role as 'super_admin' | 'admin' | 'viewer',
        created_at: new Date().toISOString(),
      };
      
      setUser(userData);
      localStorage.setItem('current_user', JSON.stringify(userData));
      dispatchAuthChange();
      
      toast({
        title: "Success",
        description: `Account created successfully with ${role} role`
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
      setUser(null);
      localStorage.removeItem('current_user');
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

      // Save new password to localStorage
      localStorage.setItem(`password_${user.email}`, newPassword);
      
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
