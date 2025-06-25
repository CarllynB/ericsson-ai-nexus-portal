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
      // Use the new database function to get current user role
      const { data, error } = await supabase.rpc('get_current_user_role');

      if (error) {
        console.error('Error fetching current user role:', error);
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
        console.error('Error fetching user roles:', error);
        toast({
          title: "Error",
          description: "Failed to fetch user roles: " + error.message,
          variant: "destructive"
        });
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
      toast({
        title: "Error",
        description: "Failed to fetch user roles",
        variant: "destructive"
      });
    }
  };

  const assignRole = async (userEmail: string, role: UserRole) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Error",
          description: "You must be logged in to assign roles",
          variant: "destructive"
        });
        return false;
      }

      // Check if user already exists in user_roles table
      const { data: existingUsers, error: fetchError } = await supabase
        .from('user_roles')
        .select('email')
        .eq('email', userEmail.toLowerCase());

      if (fetchError) {
        console.error('Error checking existing user:', fetchError);
        toast({
          title: "Error",
          description: "Failed to check existing users",
          variant: "destructive"
        });
        return false;
      }

      if (existingUsers && existingUsers.length > 0) {
        toast({
          title: "Error",
          description: "User with this email already has a role assigned",
          variant: "destructive"
        });
        return false;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        toast({
          title: "Error",
          description: "Please enter a valid email address",
          variant: "destructive"
        });
        return false;
      }

      // First, check if the user exists in auth.users by email
      const { data: authResponse, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        // If we can't fetch auth users, we'll use a placeholder UUID
        // and update it later when the user signs up
        const placeholderUserId = `pending-${crypto.randomUUID()}`;
        
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: placeholderUserId,
            email: userEmail.toLowerCase(),
            role,
            assigned_by: session.user.id
          });

        if (insertError) {
          console.error('Error assigning role:', insertError);
          toast({
            title: "Error",
            description: "Failed to assign role: " + insertError.message,
            variant: "destructive"
          });
          return false;
        }
      } else {
        // Find the user by email - properly type the users array
        const existingUser = authResponse.users?.find((u: any) => u.email === userEmail.toLowerCase());
        
        const userIdToUse = existingUser?.id || `pending-${crypto.randomUUID()}`;
        
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userIdToUse,
            email: userEmail.toLowerCase(),
            role,
            assigned_by: session.user.id
          });

        if (insertError) {
          console.error('Error assigning role:', insertError);
          toast({
            title: "Error",
            description: "Failed to assign role: " + insertError.message,
            variant: "destructive"
          });
          return false;
        }
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Error",
          description: "You must be logged in to update roles",
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .from('user_roles')
        .update({
          role: newRole,
          assigned_by: session.user.id,
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Error",
          description: "You must be logged in to delete roles",
          variant: "destructive"
        });
        return false;
      }

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
