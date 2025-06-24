
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
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

export const useAuth = () => {
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

  // Default super admin users
  const SUPER_ADMINS = ['muhammad.mahmood@ericsson.com', 'carllyn.barfi@ericsson.com'];

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          const role = SUPER_ADMINS.includes(session.user.email || '') ? 'super_admin' : 'viewer';
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role,
            created_at: session.user.created_at || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          const role = SUPER_ADMINS.includes(session.user.email || '') ? 'super_admin' : 'viewer';
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role,
            created_at: session.user.created_at || new Date().toISOString(),
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const role = SUPER_ADMINS.includes(data.user.email || '') ? 'super_admin' : 'viewer';
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          role,
          created_at: data.user.created_at || new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Password updated successfully"
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

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin',
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
