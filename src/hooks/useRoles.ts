
import { useState, useEffect } from 'react';
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
      const savedUser = localStorage.getItem('offline_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setCurrentUserRole(userData.role || 'viewer');
      } else {
        setCurrentUserRole('viewer');
      }
    } catch (error) {
      console.error('Error in fetchCurrentUserRole:', error);
      setCurrentUserRole('viewer');
    }
  };

  const fetchAllUsers = async () => {
    try {
      // In offline mode, we'll just return the current user
      const savedUser = localStorage.getItem('offline_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        const userWithRole: UserWithRole = {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          assigned_at: userData.created_at
        };
        setUsers([userWithRole]);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error in fetchAllUsers:', error);
    }
  };

  const assignRole = async (userEmail: string, role: UserRole) => {
    try {
      // In offline mode, we can't actually assign roles to other users
      toast({
        title: "Info",
        description: "Role assignment not available in offline mode"
      });
      return false;
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
      // In offline mode, we can't update user roles
      toast({
        title: "Info",
        description: "Role updates not available in offline mode"
      });
      return false;
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

  // Helper functions for role checking
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'super_admin';
  const isSuperAdmin = currentUserRole === 'super_admin';
  const canEdit = isAdmin;
  const canManageUsers = isSuperAdmin;

  useEffect(() => {
    const initRoles = async () => {
      setLoading(true);
      await fetchCurrentUserRole();
      await fetchAllUsers();
      setLoading(false);
    };

    initRoles();
  }, []);

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
