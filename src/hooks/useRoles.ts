
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type UserRole = 'super_admin' | 'admin' | 'viewer';

export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
  assigned_at: string;
}

// Temporary hardcoded roles until user_roles table is available
const SUPER_ADMINS = ['muhammad.mahmood@ericsson.com', 'carllyn.barfi@ericsson.com'];
const TEMP_USER_ROLES: Record<string, UserRole> = {
  'muhammad.mahmood@ericsson.com': 'super_admin',
  'carllyn.barfi@ericsson.com': 'super_admin',
};

export const useRoles = () => {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      // Use hardcoded roles for now
      const role = TEMP_USER_ROLES[user.email] || 'viewer';
      setCurrentUserRole(role);
    } catch (error) {
      console.error('Error in fetchCurrentUserRole:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      // For now, return the hardcoded super admins
      const formattedUsers: UserWithRole[] = SUPER_ADMINS.map(email => ({
        id: email.includes('muhammad') ? 'cfd87936-7cef-4ddb-bea6-88cf29f6c399' : 'temp-carllyn-id',
        email,
        role: 'super_admin' as UserRole,
        assigned_at: new Date().toISOString()
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error in fetchAllUsers:', error);
    }
  };

  const assignRole = async (userId: string, role: UserRole) => {
    try {
      // For now, just update local state
      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, role } : user
        )
      );

      toast({
        title: "Success",
        description: "Role assigned successfully (temporary implementation)"
      });

      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    const initRoles = async () => {
      setLoading(true);
      await fetchCurrentUserRole();
      await fetchAllUsers();
      setLoading(false);
    };

    initRoles();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      initRoles();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    currentUserRole,
    users,
    loading,
    assignRole,
    fetchCurrentUserRole,
    fetchAllUsers
  };
};
