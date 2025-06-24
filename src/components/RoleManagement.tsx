
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Shield, Mail, Users, Trash2, AlertCircle } from 'lucide-react';
import { useRoles, UserRole } from '@/hooks/useRoles';
import { useToast } from '@/hooks/use-toast';

export const RoleManagement = () => {
  const { users, assignRole, updateUserRole, deleteUserRole, currentUserRole, loading } = useRoles();
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('admin');
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const success = await updateUserRole(userId, newRole);
    if (success) {
      toast({
        title: "Role Updated",
        description: `User role updated to ${newRole}`,
      });
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    const success = await assignRole(newUserEmail.trim(), newUserRole);
    if (success) {
      setNewUserEmail('');
      setNewUserRole('admin');
    }
    setIsAssigning(false);
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (window.confirm(`Are you sure you want to delete the role assignment for ${userEmail}?`)) {
      await deleteUserRole(userId);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const canDeleteRole = (role: UserRole) => {
    return currentUserRole === 'super_admin' || (currentUserRole === 'admin' && role !== 'super_admin');
  };

  const canAssignRole = () => {
    return currentUserRole === 'super_admin' || currentUserRole === 'admin';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Loading role management...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canAssignRole()) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">You don't have permission to manage user roles.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Role Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Assign New Role */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4" />
              <h3 className="font-medium">Assign Role</h3>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="flex-1"
                type="email"
                disabled={isAssigning}
              />
              <Select
                value={newUserRole}
                onValueChange={(value: UserRole) => setNewUserRole(value)}
                disabled={isAssigning}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentUserRole === 'super_admin' && (
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  )}
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddUser} disabled={isAssigning}>
                {isAssigning ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {isAssigning ? 'Assigning...' : 'Assign Role'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Assign a role to a user by their email. When they sign up with this email, they'll automatically have this role.
            </p>
          </div>

          {/* Existing Users */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4" />
              <h3 className="font-medium">Existing User Roles</h3>
            </div>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Assigned: {new Date(user.assigned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Select
                      value={user.role}
                      onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                      disabled={user.role === 'super_admin' && currentUserRole !== 'super_admin'}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        {currentUserRole === 'super_admin' && (
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {canDeleteRole(user.role) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.email)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No role assignments found.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
