
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { backendApiService } from '@/services/backendApi';
import { sqliteService } from '@/services/sqlite';
import { useAuth } from '@/hooks/useAuth';

export type UserRole = 'super_admin' | 'admin' | 'viewer';

export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
  assigned_at: string;
}

// Custom event for role changes
const dispatchRoleChange = () => {
  window.dispatchEvent(new CustomEvent('roleChange'));
};

export const useRoles = () => {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCurrentUserRole = async () => {
    try {
      if (!user) {
        setCurrentUserRole(null);
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching current user role for:', user.email);
      
      // Get role from SQLite ONLY - no Supabase dependency
      let role = await sqliteService.getUserRole(user.email);
      
      // If not found in SQLite, try backend as fallback
      if (!role && backendApiService.isAuthenticated) {
        try {
          const roleResponse = await backendApiService.getUserRole();
          role = roleResponse.role;
          // Store in SQLite for future use
          if (role) {
            await sqliteService.createUserRole(user.email, role as UserRole);
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch role from backend');
        }
      }
      
      // Default to viewer if no role found
      const finalRole = (role as UserRole) || 'viewer';
      setCurrentUserRole(finalRole);
      console.log('✅ User role determined:', finalRole);
      
    } catch (error) {
      console.error('❌ Error in fetchCurrentUserRole:', error);
      setCurrentUserRole('viewer'); // Default fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      if (!user) {
        console.log('Not authenticated, skipping user fetch');
        return;
      }

      // Get users from SQLite ONLY - completely removed Supabase dependency
      const allUsers = await sqliteService.getAllUserRoles();
      console.log('✅ Fetched users with roles from SQLite:', allUsers);
      
      setUsers(allUsers.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        assigned_at: user.assigned_at
      })));
    } catch (error) {
      console.error('❌ Error in fetchAllUsers:', error);
      setUsers([]);
    }
  };

  const assignRole = async (userEmail: string, role: UserRole) => {
    try {
      console.log(`🔄 Starting role assignment: ${userEmail} -> ${role}`);
      
      // Assign role in SQLite
      await sqliteService.createUserRole(userEmail, role, user?.email);
      console.log('✅ Role assignment completed in SQLite');
      
      // Try to sync with backend if available
      try {
        if (backendApiService.isAuthenticated) {
          await backendApiService.assignRole(userEmail, role);
          console.log('✅ Role synced with backend');
        }
      } catch (error) {
        console.warn('⚠️ Could not sync with backend:', error);
      }
      
      // Refresh the users list
      await fetchAllUsers();
      dispatchRoleChange(); // Notify other components
      
      toast({
        title: "Success",
        description: `Role ${role} assigned to ${userEmail}. They will have this role when they log in.`
      });
      return true;
    } catch (error) {
      console.error('❌ Error assigning role:', error);
      toast({
        title: "Error", 
        description: `Failed to assign role: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      console.log(`🔄 Starting role update: ${userId} -> ${newRole}`);
      
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) {
        throw new Error('User not found');
      }
      
      // Update role in SQLite
      await sqliteService.updateUserRole(userToUpdate.email, newRole);
      console.log('✅ Role update completed in SQLite');
      
      // Try to sync with backend if available
      try {
        if (backendApiService.isAuthenticated) {
          await backendApiService.updateUserRole(userId, newRole);
          console.log('✅ Role synced with backend');
        }
      } catch (error) {
        console.warn('⚠️ Could not sync with backend:', error);
      }
      
      // Update current user if it's the same user
      if (user && user.email === userToUpdate.email) {
        setCurrentUserRole(newRole);
      }
      
      // Refresh the users list
      await fetchAllUsers();
      dispatchRoleChange(); // Notify other components
      
      toast({
        title: "Success",
        description: `Role updated to ${newRole}`
      });
      return true;
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      toast({
        title: "Error",
        description: `Failed to update role: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  };

  // Helper functions for role checking
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'super_admin';
  const isSuperAdmin = currentUserRole === 'super_admin';
  const canEdit = isAdmin;
  const canManageUsers = isSuperAdmin;

  useEffect(() => {
    const initRoles = async () => {
      if (!user) {
        setCurrentUserRole(null);
        setUsers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      await fetchCurrentUserRole();
      
      // Only fetch all users if current user is super admin
      if (currentUserRole === 'super_admin') {
        await fetchAllUsers();
      }
      
      setLoading(false);
    };

    initRoles();

    // Listen for auth changes
    const handleAuthChange = () => {
      if (user) {
        fetchCurrentUserRole();
        if (currentUserRole === 'super_admin') {
          fetchAllUsers();
        }
      } else {
        setCurrentUserRole(null);
        setUsers([]);
      }
    };

    // Listen for role changes from other components
    const handleRoleChange = () => {
      fetchCurrentUserRole();
      if (currentUserRole === 'super_admin') {
        fetchAllUsers();
      }
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('roleChange', handleRoleChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('roleChange', handleRoleChange);
    };
  }, [user, currentUserRole]);

  return {
    currentUserRole,
    users,
    loading,
    assignRole,
    updateUserRole,
    fetchCurrentUserRole,
    fetchAllUsers,
    // Helper properties
    isAdmin,
    isSuperAdmin,
    canEdit,
    canManageUsers
  };
};
