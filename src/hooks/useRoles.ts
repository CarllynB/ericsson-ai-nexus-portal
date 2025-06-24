
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
      if (!user?.email) {
        setCurrentUserRole('viewer');
        return;
      }

      // Use the database function to get the user's role
      const { data, error } = await supabase.rpc('get_user_role', {
        user_email: user.email
      });

      if (error) {
        console.error('Error fetching user role:', error);
        setCurrentUserRole('viewer');
        return;
      }

      setCurrentUserRole(data as UserRole);
    } catch (error) {
      console.error('Error in fetchCurrentUserRole:', error);
      setCurrentUserRole('viewer');
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      const formattedUsers: UserWithRole[] = data.map(user => ({
        id: user.user_id,
        email: user.email,
        role: user.role as UserRole,
        assigned_at: user.assigned_at
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error in fetchAllUsers:', error);
    }
  };

  const assignRole = async (userEmail: string, role: UserRole) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // First, check if user exists in auth.users by trying to find them
      // Since we can't directly query auth.users, we'll insert and let the foreign key constraint handle validation
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: `temp-${Date.now()}`, // This will be updated when the user signs up
          email: userEmail,
          role,
          assigned_by: currentUser?.id
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error assigning role:', error);
        toast({
          title: "Error",
          description: "Failed to assign role",
          variant: "destructive"
        });
        return false;
      }

      // Refresh the users list
      await fetchAllUsers();

      toast({
        title: "Success",
        description: `Role ${role} assigned to ${userEmail}`
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

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('user_roles')
        .update({
          role: newRole,
          assigned_by: currentUser?.id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        toast({
          title: "Error",
          description: "Failed to update role",
          variant: "destructive"
        });
        return false;
      }

      // Refresh the users list
      await fetchAllUsers();

      toast({
        title: "Success",
        description: "Role updated successfully"
      });

      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
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
    updateUserRole,
    fetchCurrentUserRole,
    fetchAllUsers
  };
};
