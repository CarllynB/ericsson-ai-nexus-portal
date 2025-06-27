
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fileStorageService } from '@/services/fileStorage';

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
        
        // Always check file storage for the most up-to-date role
        const roleFromStorage = await fileStorageService.getUserRole(userData.email);
        
        if (roleFromStorage) {
          // Update localStorage with the latest role from storage
          userData.role = roleFromStorage;
          localStorage.setItem('current_user', JSON.stringify(userData));
          setCurrentUserRole(roleFromStorage as UserRole);
          console.log('✅ Updated user role from persistent storage:', roleFromStorage);
        } else {
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
      const allUsers = await fileStorageService.getAllUserRoles();
      
      console.log('✅ Fetched users with roles from persistent storage:', allUsers);
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
      
      // Get current user for assignedBy
      const savedUser = localStorage.getItem('current_user');
      const assignedBy = savedUser ? JSON.parse(savedUser).email : undefined;
      
      // Create or update the user role in persistent storage
      await fileStorageService.createUserRole(userEmail, role, assignedBy);
      console.log('✅ Role assignment completed in persistent storage');
      
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
      
      // Update the role using the email
      await fileStorageService.updateUserRole(user.email, newRole);
      console.log('✅ Role update completed in persistent storage');
      
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
