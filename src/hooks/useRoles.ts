
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
        
        // Always check SQLite for the most up-to-date role
        const roleFromDb = await sqliteService.getUserRole(userData.email);
        if (roleFromDb) {
          // Update localStorage with the latest role from SQLite
          userData.role = roleFromDb;
          localStorage.setItem('current_user', JSON.stringify(userData));
          setCurrentUserRole(roleFromDb as UserRole);
        } else {
          setCurrentUserRole(userData.role || 'viewer');
        }
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
      const allUsers = await sqliteService.getAllUserRoles();
      
      console.log('Fetched users with roles from SQLite:', allUsers);
      setUsers(allUsers.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        assigned_at: user.assigned_at
      })));
    } catch (error) {
      console.error('Error in fetchAllUsers:', error);
      setUsers([]);
    }
  };

  const assignRole = async (userEmail: string, role: UserRole) => {
    try {
      await sqliteService.initialize();
      
      // Get current user for assignedBy
      const savedUser = localStorage.getItem('current_user');
      const assignedBy = savedUser ? JSON.parse(savedUser).email : undefined;
      
      await sqliteService.createUserRole(userEmail, role, assignedBy);
      
      await fetchAllUsers();
      
      toast({
        title: "Success",
        description: `Role ${role} assigned to ${userEmail}. They will have this role when they log in.`
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
      
      // Update in SQLite using the proper method
      const stmt = sqliteService.db?.prepare('UPDATE user_roles SET role = ?, updated_at = ? WHERE email = ?');
      if (stmt) {
        stmt.run([newRole, new Date().toISOString(), user.email]);
        stmt.free();
        
        // Save the database
        const data = sqliteService.db?.export();
        if (data) {
          const dataArray = Array.from(data);
          localStorage.setItem('sqlite_database', JSON.stringify(dataArray));
        }
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
