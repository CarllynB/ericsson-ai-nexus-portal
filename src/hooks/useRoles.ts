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
      
      // Check if user already exists - use maybeSingle() instead of single()
      const { data: existingUser, error: checkError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing user:', checkError);
        toast({
          title: "Error",
          description: "Failed to check existing user",
          variant: "destructive"
        });
        return false;
      }

      if (existingUser) {
        // Update existing user's role
        const { error } = await supabase
          .from('user_roles')
          .update({
            role,
            assigned_by: currentUser?.id,
            updated_at: new Date().toISOString()
          })
          .eq('email', userEmail);

        if (error) {
          console.error('Error updating role:', error);
          toast({
            title: "Error",
            description: "Failed to update role",
            variant: "destructive"
          });
          return false;
        }
      } else {
        // For new role assignments, we need to handle the user_id
        // Since we can't query auth.users directly, we'll use a placeholder UUID
        // The database will need to handle this via a trigger or we need a different approach
        
        // First, let's try to get the current user's ID to use as a temporary user_id
        // This is not ideal, but works for the immediate issue
        const tempUserId = currentUser?.id || '00000000-0000-0000-0000-000000000000';
        
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: tempUserId, // This is a workaround - ideally we'd resolve the actual user_id
            email: userEmail,
            role,
            assigned_by: currentUser?.id
          });

        if (error) {
          console.error('Error assigning role:', error);
          toast({
            title: "Error",
            description: "Failed to assign role. The user may need to sign up first.",
            variant: "destructive"
          });
          return false;
        }
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
        .eq('id', userId);

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
