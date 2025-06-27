
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { sqliteService } from '@/services/sqlite';

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
        console.log('Current user data:', userData);
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
      await sqliteService.initialize();
      
      // Get all users from SQLite user_roles table
      const stmt = sqliteService['db']?.prepare('SELECT * FROM user_roles ORDER BY assigned_at DESC');
      const usersWithRoles: UserWithRole[] = [];
      
      if (stmt) {
        while (stmt.step()) {
          const row = stmt.getAsObject();
          usersWithRoles.push({
            id: row.id as string,
            email: row.email as string,
            role: row.role as UserRole,
            assigned_at: row.assigned_at as string
          });
        }
        stmt.free();
      }
      
      // Add current user if not in the list
      const savedUser = localStorage.getItem('current_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (!usersWithRoles.some(u => u.email === userData.email)) {
          usersWithRoles.unshift({
            id: userData.id,
            email: userData.email,
            role: userData.role,
            assigned_at: userData.created_at
          });
        }
      }
      
      console.log('Fetched users with roles:', usersWithRoles);
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error in fetchAllUsers:', error);
      setUsers([]);
    }
  };

  const assignRole = async (userEmail: string, role: UserRole) => {
    try {
      await sqliteService.initialize();
      await sqliteService.createUserRole(userEmail, role);
      
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
      
      await sqliteService.initialize();
      
      // Update in SQLite
      const stmt = sqliteService['db']?.prepare('UPDATE user_roles SET role = ? WHERE email = ?');
      if (stmt) {
        stmt.run([newRole, user.email]);
        stmt.free();
      }
      
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
      
      await fetchAllUsers();
      
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

    // Listen for storage changes to update roles without page reload
    const handleStorageChange = () => {
      fetchCurrentUserRole();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when user logs in/out
    const handleAuthChange = () => {
      fetchCurrentUserRole();
      fetchAllUsers();
    };

    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
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
