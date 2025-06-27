
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

  // Initialize app (populate agents if needed) - No Supabase dependency
  useInitializeApp();

  // Default super admin users - These are the system admins
  const SUPER_ADMINS = ['muhammad.mahmood@ericsson.com', 'carllyn.barfi@ericsson.com'];

  // Helper to dispatch auth change events for real-time UI updates
  const dispatchAuthChange = () => {
    console.log('📡 Dispatching auth change event...');
    window.dispatchEvent(new CustomEvent('authChange'));
  };

  useEffect(() => {
    // Check localStorage for existing user session on app start
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('🔄 Restoring user session for:', userData.email);
        setUser(userData);
        dispatchAuthChange();
      } catch (error) {
        console.error('❌ Error parsing saved user:', error);
        localStorage.removeItem('current_user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔐 Attempting login for:', email);
      setLoading(true);
      
      // Check if it's a super admin (system admin)
      if (SUPER_ADMINS.includes(email)) {
        console.log('👑 Super admin login detected');
        // Check for custom password first, fallback to default
        const savedPassword = localStorage.getItem(`password_${email}`);
        const correctPassword = savedPassword || 'admin123';
        
        if (password === correctPassword) {
          const userData: User = {
            id: email.replace('@', '_').replace(/\./g, '_'),
            email,
            role: 'super_admin',
            created_at: new Date().toISOString(),
          };
          
          setUser(userData);
          localStorage.setItem('current_user', JSON.stringify(userData));
          dispatchAuthChange();
          
          toast({
            title: "Success",
            description: "Logged in successfully as Super Admin"
          });
        } else {
          throw new Error('Invalid password');
        }
      } else {
        // For regular users, check if they have a password set
        const savedPassword = localStorage.getItem(`password_${email}`);
        
        if (savedPassword) {
          // User exists, check password
          if (password === savedPassword) {
            console.log('✅ Password verified, getting role from SQLite...');
            
            // Get user role from SQLite - this is the key part for role management
            const { sqliteService } = await import('@/services/sqlite');
            await sqliteService.initialize();
            
            let role = await sqliteService.getUserRole(email);
            console.log('📋 Role from SQLite:', role);
            
            if (!role) {
              // If no role assigned, default to viewer and create the role
              console.log('⚠️ No role found, assigning default viewer role');
              role = 'viewer';
              await sqliteService.createUserRole(email, 'viewer', 'system');
            }
            
            const userData: User = {
              id: email.replace('@', '_').replace(/\./g, '_'),
              email,
              role: role as 'super_admin' | 'admin' | 'viewer',
              created_at: new Date().toISOString(),
            };
            
            setUser(userData);
            localStorage.setItem('current_user', JSON.stringify(userData));
            dispatchAuthChange();
            
            toast({
              title: "Success",
              description: `Logged in successfully as ${role.replace('_', ' ').toUpperCase()}`
            });
            
            console.log('✅ Login successful with role:', role);
          } else {
            throw new Error('Invalid password');
          }
        } else {
          throw new Error('Account not found. Please create an account first.');
        }
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
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
      console.log('📝 Attempting registration for:', email);
      setLoading(true);
      
      // Check if user already exists
      const existingPassword = localStorage.getItem(`password_${email}`);
      if (existingPassword) {
        throw new Error('Account already exists. Please sign in instead.');
      }
      
      // Validate password strength
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Create new user account
      localStorage.setItem(`password_${email}`, password);
      console.log('💾 Password saved for user:', email);
      
      // Check if there's already a role assigned for this email in SQLite
      const { sqliteService } = await import('@/services/sqlite');
      await sqliteService.initialize();
      
      let role = await sqliteService.getUserRole(email);
      console.log('🔍 Checking for pre-assigned role:', role);
      
      if (!role) {
        // If no role was pre-assigned, default to viewer
        console.log('⚠️ No pre-assigned role found, assigning default viewer role');
        role = 'viewer';
        await sqliteService.createUserRole(email, 'viewer', 'system');
      } else {
        console.log('✅ Using pre-assigned role:', role);
      }
      
      const userData: User = {
        id: email.replace('@', '_').replace(/\./g, '_'),
        email,
        role: role as 'super_admin' | 'admin' | 'viewer',
        created_at: new Date().toISOString(),
      };
      
      setUser(userData);
      localStorage.setItem('current_user', JSON.stringify(userData));
      dispatchAuthChange();
      
      toast({
        title: "Success",
        description: `Account created successfully with ${role.replace('_', ' ').toUpperCase()} role`
      });
      
      console.log('✅ Registration successful with role:', role);
    } catch (error) {
      console.error('❌ Registration failed:', error);
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
      console.log('🚪 Logging out user...');
      setUser(null);
      localStorage.removeItem('current_user');
      dispatchAuthChange();
      
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      // Validate new password
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Save new password to localStorage
      localStorage.setItem(`password_${user.email}`, newPassword);
      
      toast({
        title: "Success",
        description: "Password changed successfully"
      });
      
      console.log('✅ Password changed successfully for:', user.email);
      return true;
    } catch (error) {
      console.error('❌ Password change error:', error);
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
