
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

  const getUserRole = async (userId: string): Promise<'super_admin' | 'admin' | 'viewer'> => {
    try {
      const { data, error } = await supabase.rpc('get_current_user_role');
      
      if (error) {
        console.error('Error fetching user role:', error);
        return 'viewer';
      }
      
      return data || 'viewer';
    } catch (error) {
      console.error('Error in getUserRole:', error);
      return 'viewer';
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Check for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
        
        if (isMounted && session?.user) {
          console.log('Found existing session for:', session.user.email);
          try {
            const role = await getUserRole(session.user.id);
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role,
              created_at: session.user.created_at || new Date().toISOString(),
            });
          } catch (roleError) {
            console.error('Error fetching role for existing session:', roleError);
            // Don't clear user session if role fetching fails, just set default role
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: 'viewer',
              created_at: session.user.created_at || new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!isMounted) return;

        if (session?.user) {
          try {
            const role = await getUserRole(session.user.id);
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role,
              created_at: session.user.created_at || new Date().toISOString(),
            });
          } catch (roleError) {
            console.error('Error fetching role on auth change:', roleError);
            // Don't clear the session if role fetching fails
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: 'viewer',
              created_at: session.user.created_at || new Date().toISOString(),
            });
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (data.user) {
        console.log('Login successful for:', data.user.email);
        try {
          const role = await getUserRole(data.user.id);
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            role,
            created_at: data.user.created_at || new Date().toISOString(),
          });
        } catch (roleError) {
          console.error('Error fetching role after login:', roleError);
          // Don't fail login if role fetching fails
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            role: 'viewer',
            created_at: data.user.created_at || new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('Logging out...');
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
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
