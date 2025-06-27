
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
      const savedUser = localStorage.getItem('current_user');
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
      const userRoles = JSON.parse(localStorage.getItem('user_roles') || '{}');
      const usersWithRoles: UserWithRole[] = [];
      
      // Get current user
      const savedUser = localStorage.getItem('current_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        usersWithRoles.push({
          id: userData.id,
          email: userData.email,
          role: userData.role,
          assigned_at: userData.created_at
        });
      }
      
      // Get all users from roles
      Object.entries(userRoles).forEach(([email, role]) => {
        if (!usersWithRoles.some(u => u.email === email)) {
          usersWithRoles.push({
            id: email.replace('@', '_').replace('.', '_'),
            email,
            role: role as UserRole,
            assigned_at: new Date().toISOString()
          });
        }
      });
      
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error in fetchAllUsers:', error);
    }
  };

  const assignRole = async (userEmail: string, role: UserRole) => {
    try {
      const existingRoles = JSON.parse(localStorage.getItem('user_roles') || '{}');
      existingRoles[userEmail] = role;
      localStorage.setItem('user_roles', JSON.stringify(existingRoles));
      
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
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      const existingRoles = JSON.parse(localStorage.getItem('user_roles') || '{}');
      existingRoles[user.email] = newRole;
      localStorage.setItem('user_roles', JSON.stringify(existingRoles));
      
      // Update current user if it's the same user
      const savedUser = localStorage.getItem('current_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.email === user.email) {
          userData.role = newRole;
          localStorage.setItem('current_user', JSON.stringify(userData));
        }
      }
      
      await fetchAllUsers();
      await fetchCurrentUserRole();
      
      toast({
        title: "Success",
        description: `Role updated to ${newRole}`
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
