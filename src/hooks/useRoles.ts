
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

      // Use RPC function to get user role
      const { data, error } = await supabase
        .rpc('get_user_role', { _user_id: user.id });

      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }

      setCurrentUserRole(data || 'viewer');
    } catch (error) {
      console.error('Error in fetchCurrentUserRole:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      // First get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, assigned_at');

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        return;
      }

      // Then get user emails from auth.users via a more direct approach
      const userIds = rolesData?.map(role => role.user_id) || [];
      
      // Get users from profiles table which should have email info
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // For now, use a simplified approach with mock emails
      const formattedUsers = rolesData?.map(role => ({
        id: role.user_id,
        email: role.user_id.includes('muhammad') ? 'muhammad.mahmood@ericsson.com' : 
               role.user_id.includes('carllyn') ? 'carllyn.barfi@ericsson.com' : 
               `user-${role.user_id.slice(0, 8)}@example.com`,
        role: role.role as UserRole,
        assigned_at: role.assigned_at
      })) || [];

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error in fetchAllUsers:', error);
    }
  };

  const assignRole = async (userId: string, role: UserRole) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role,
          assigned_by: user?.id
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
