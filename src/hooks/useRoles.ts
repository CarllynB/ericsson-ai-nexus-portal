import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { backendApiService } from '@/services/backendApi';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();

  const fetchCurrentUserRole = async () => {
    try {
      if (!user) {
        setCurrentUserRole(null);
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching current user role for:', user.email);
      
      // First try to get from stored user data
      if (user.role) {
        setCurrentUserRole(user.role as UserRole);
        console.log('✅ Using stored user role:', user.role);
      }
      
      // Then verify with backend if authenticated
      if (backendApiService.isAuthenticated) {
        try {
          const roleResponse = await backendApiService.getUserRole();
          console.log('✅ Backend role response:', roleResponse);
          setCurrentUserRole(roleResponse.role as UserRole);
          
          // Update localStorage with the latest role
          const savedUser = localStorage.getItem('current_user');
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            userData.role = roleResponse.role;
            localStorage.setItem('current_user', JSON.stringify(userData));
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch role from backend, using stored role');
          // Keep the stored role if backend call fails
        }
      }
    } catch (error) {
      console.error('❌ Error in fetchCurrentUserRole:', error);
      setCurrentUserRole('viewer'); // Default fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      if (!user || !backendApiService.isAuthenticated) {
        console.log('Not authenticated, skipping user fetch');
        return;
      }

      const allUsers = await backendApiService.getAllUserRoles();
      console.log('✅ Fetched users with roles from backend:', allUsers);
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
      
      await backendApiService.assignRole(userEmail, role);
      console.log('✅ Role assignment completed via backend');
      
      // Refresh the users list
      await fetchAllUsers();
      
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
      
      await backendApiService.updateUserRole(userId, newRole);
      console.log('✅ Role update completed via backend');
      
      // Update current user if it's the same user
      if (user && user.email === userToUpdate.email) {
        setCurrentUserRole(newRole);
        // Update localStorage
        const savedUser = localStorage.getItem('current_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          userData.role = newRole;
          localStorage.setItem('current_user', JSON.stringify(userData));
        }
      }
      
      // Refresh the users list
      await fetchAllUsers();
      
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

    // Listen for storage changes to update roles without page reload
    const handleStorageChange = () => {
      if (user) {
        fetchCurrentUserRole();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when user logs in/out
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

    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
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
