
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { backendApiService } from '@/services/backendApi';

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
      const savedUser = localStorage.getItem('current_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        console.log('🔍 Current user data:', userData);
        
        // Get role from backend
        try {
          const roleResponse = await backendApiService.getUserRole();
          setCurrentUserRole(roleResponse.role as UserRole);
          
          // Update localStorage with the latest role
          userData.role = roleResponse.role;
          localStorage.setItem('current_user', JSON.stringify(userData));
          console.log('✅ Updated user role from backend:', roleResponse.role);
        } catch (error) {
          // If backend call fails, use stored role
          setCurrentUserRole(userData.role || 'viewer');
        }
      } else {
        setCurrentUserRole('viewer');
      }
    } catch (error) {
      console.error('❌ Error in fetchCurrentUserRole:', error);
      setCurrentUserRole('viewer');
    }
  };

  const fetchAllUsers = async () => {
    try {
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
      setLoading(true);
      
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
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      console.log(`🔄 Starting role update: ${userId} -> ${newRole}`);
      setLoading(true);
      
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      await backendApiService.updateUserRole(userId, newRole);
      console.log('✅ Role update completed via backend');
      
      // Update current user if it's the same user
      const savedUser = localStorage.getItem('current_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.email === user.email) {
          userData.role = newRole;
          localStorage.setItem('current_user', JSON.stringify(userData));
          setCurrentUserRole(newRole);
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
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for role checking
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'super_admin';
  const isSuperAdmin = currentUserRole === 'super_admin';
  const canEdit = isAdmin;
  const canManageUsers = isSuperAdmin;

  useEffect(() => {
    const initRoles = async () => {
      setLoading(true);
      await fetchCurrentUserRole();
      if (isSuperAdmin) {
        await fetchAllUsers();
      }
      setLoading(false);
    };

    initRoles();

    // Listen for storage changes to update roles without page reload
    const handleStorageChange = () => {
      fetchCurrentUserRole();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when user logs in/out
    const handleAuthChange = () => {
      fetchCurrentUserRole();
      if (isSuperAdmin) {
        fetchAllUsers();
      }
    };

    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [isSuperAdmin]);

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
