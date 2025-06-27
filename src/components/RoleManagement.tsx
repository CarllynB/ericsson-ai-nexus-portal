import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Shield, Mail, Users, Loader2 } from 'lucide-react';
import { useRoles, UserRole } from '@/hooks/useRoles';
import { useToast } from '@/components/ui/use-toast';

export const RoleManagement = () => {
  const { users, assignRole, updateUserRole, loading } = useRoles();
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('admin');
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    console.log('🔄 Role change initiated for userId:', userId, 'newRole:', newRole);
    const success = await updateUserRole(userId, newRole);
    if (success) {
      toast({
        title: "Role Updated",
        description: `User role updated to ${newRole.replace('_', ' ').toUpperCase()}`,
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    const existingUser = users.find(user => user.email.toLowerCase() === newUserEmail.toLowerCase());
    if (existingUser) {
      toast({
        title: "Error",
        description: "User with this email already has a role assigned",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    console.log('📝 Assigning role:', newUserRole, 'to email:', newUserEmail);
    
    const success = await assignRole(newUserEmail.trim(), newUserRole);
    if (success) {
      toast({
        title: "Success",
        description: `${newUserRole.replace('_', ' ').toUpperCase()} role assigned to ${newUserEmail}`,
      });
      setNewUserEmail('');
      setNewUserRole('admin');
    }
    setIsAssigning(false);
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

  const formatRoleDisplay = (role: UserRole) => {
    return role.replace('_', ' ').toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading role management...</span>
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
          {/* Assign New Role Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4" />
              <h3 className="font-medium">Assign Role to User</h3>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address (e.g., user@company.com)"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="flex-1"
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
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddUser} disabled={isAssigning}>
                {isAssigning ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {isAssigning ? 'Assigning...' : 'Assign Role'}
              </Button>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> Assign a role to a user by their email address. 
                When they create an account with this email, they'll automatically have the assigned role.
                If they already have an account, they'll see the new role after their next login.
              </p>
            </div>
          </div>

          {/* Existing Users Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4" />
              <h3 className="font-medium">Existing User Roles ({users.length})</h3>
            </div>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={`${user.id}-${user.email}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
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
                      {formatRoleDisplay(user.role)}
                    </Badge>
                    <Select
                      value={user.role}
                      onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-center text-muted-foreground">
                    No role assignments found. Start by assigning roles to users above.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
