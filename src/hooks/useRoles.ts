
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

export const useRoles = () => {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }

      setCurrentUserRole(data?.role || 'viewer');
    } catch (error) {
      console.error('Error in fetchCurrentUserRole:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          assigned_at,
          user:auth.users(email)
        `);

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      const formattedUsers = data?.map(item => ({
        id: item.user_id,
        email: (item.user as any)?.email || 'Unknown',
        role: item.role as UserRole,
        assigned_at: item.assigned_at
      })) || [];

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error in fetchAllUsers:', error);
    }
  };

  const assignRole = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to assign role",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Role assigned successfully"
      });

      await fetchAllUsers();
      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
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
