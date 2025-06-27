
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
        console.log('🔍 Fetching current user role for:', userData.email);
        
        // Always check SQLite for the most up-to-date role
        const roleFromDb = await sqliteService.getUserRole(userData.email);
        console.log('📋 Role from SQLite:', roleFromDb);
        
        if (roleFromDb) {
          // Update localStorage with the latest role from SQLite
          userData.role = roleFromDb;
          localStorage.setItem('current_user', JSON.stringify(userData));
          setCurrentUserRole(roleFromDb as UserRole);
          console.log('✅ Updated current user role to:', roleFromDb);
        } else {
          // If no role in SQLite, default to viewer and create it
          console.log('⚠️ No role found in SQLite, defaulting to viewer');
          await sqliteService.createUserRole(userData.email, 'viewer');
          setCurrentUserRole('viewer');
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
      console.log('🔍 Fetching all users with roles...');
      await sqliteService.initialize();
      const allUsers = await sqliteService.getAllUserRoles();
      
      console.log('📋 Fetched users with roles from SQLite:', allUsers);
      setUsers(allUsers.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        assigned_at: user.assigned_at
      })));
      console.log('✅ Successfully set users state with', allUsers.length, 'users');
    } catch (error) {
      console.error('❌ Error in fetchAllUsers:', error);
      setUsers([]);
    }
  };

  const assignRole = async (userEmail: string, role: UserRole) => {
    try {
      console.log('🔄 Assigning role:', role, 'to user:', userEmail);
      await sqliteService.initialize();
      
      // Get current user for assignedBy tracking
      const savedUser = localStorage.getItem('current_user');
      const assignedBy = savedUser ? JSON.parse(savedUser).email : 'system';
      
      console.log('📝 Creating user role in SQLite...');
      await sqliteService.createUserRole(userEmail, role, assignedBy);
      
      console.log('🔄 Refreshing user list...');
      await fetchAllUsers();
      
      toast({
        title: "Success",
        description: `Role ${role} assigned to ${userEmail}. They will have this role when they log in.`
      });
      
      console.log('✅ Role assignment completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error assigning role:', error);
      toast({
        title: "Error",
        description: `Failed to assign role: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      return false;
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      console.log('🔄 Updating user role for userId:', userId, 'to role:', newRole);
      
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found in current users list');
      }
      
      console.log('👤 Found user:', user.email, 'updating role...');
      await sqliteService.initialize();
      
      // Update role in SQLite using the email
      await sqliteService.updateUserRole(user.email, newRole);
      
      // Update current user's role if it's the same user
      const savedUser = localStorage.getItem('current_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.email === user.email) {
          userData.role = newRole;
          localStorage.setItem('current_user', JSON.stringify(userData));
          setCurrentUserRole(newRole);
          console.log('✅ Updated current user role in localStorage');
        }
      }
      
      console.log('🔄 Refreshing user list...');
      await fetchAllUsers();
      
      toast({
        title: "Success",
        description: `Role updated to ${newRole}`
      });
      
      console.log('✅ Role update completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      toast({
        title: "Error",
        description: `Failed to update role: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      console.log('🚀 Initializing roles system...');
      setLoading(true);
      await fetchCurrentUserRole();
      await fetchAllUsers();
      setLoading(false);
      console.log('✅ Roles system initialized');
    };

    initRoles();

    // Listen for storage changes to update roles without page reload
    const handleStorageChange = () => {
      console.log('📡 Storage change detected, updating roles...');
      fetchCurrentUserRole();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom auth change events
    const handleAuthChange = () => {
      console.log('🔄 Auth change detected, updating roles...');
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
