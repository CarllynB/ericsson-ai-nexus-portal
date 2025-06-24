
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
        id: user.id,
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
      
      // Check if user already exists
      const existingUser = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
      if (existingUser) {
        toast({
          title: "Error",
          description: "User with this email already has a role assigned",
          variant: "destructive"
        });
        return false;
      }

      // Generate a unique user ID for role assignment
      const tempUserId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: tempUserId,
          email: userEmail.toLowerCase(),
          role,
          assigned_by: currentUser?.id
        });

      if (error) {
        console.error('Error assigning role:', error);
        toast({
          title: "Error",
          description: "Failed to assign role: " + error.message,
          variant: "destructive"
        });
        return false;
      }

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
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        toast({
          title: "Error",
          description: "Failed to update role: " + error.message,
          variant: "destructive"
        });
        return false;
      }

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

  const deleteUserRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user role:', error);
        toast({
          title: "Error",
          description: "Failed to delete role: " + error.message,
          variant: "destructive"
        });
        return false;
      }

      await fetchAllUsers();
      toast({
        title: "Success",
        description: "Role deleted successfully"
      });

      return true;
    } catch (error) {
      console.error('Error deleting user role:', error);
      toast({
        title: "Error",
        description: "Failed to delete role",
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
    deleteUserRole,
    fetchCurrentUserRole,
    fetchAllUsers
  };
};
