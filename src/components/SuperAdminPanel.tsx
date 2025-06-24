
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Shield, Mail, ExternalLink, Settings } from 'lucide-react';
import { useRoles, UserRole } from '@/hooks/useRoles';
import { useToast } from '@/components/ui/use-toast';
import { useDashboardLink } from '@/hooks/useDashboardLink';

export const SuperAdminPanel = () => {
  const { users, assignRole, updateUserRole } = useRoles();
  const { dashboardLink, updateDashboardLink } = useDashboardLink();
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('admin');
  const [newDashboardLink, setNewDashboardLink] = useState('');
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

    // Check if user already exists
    const existingUser = users.find(user => user.email.toLowerCase() === newUserEmail.toLowerCase());
    if (existingUser) {
      toast({
        title: "Error",
        description: "User with this email already has a role assigned",
        variant: "destructive"
      });
      return;
    }

    const success = await assignRole(newUserEmail, newUserRole);
    if (success) {
      toast({
        title: "Success",
        description: `${newUserRole} role assigned to ${newUserEmail}`,
      });
      setNewUserEmail('');
      setNewUserRole('admin');
    }
  };

  const handleUpdateDashboardLink = async () => {
    if (!newDashboardLink.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid dashboard URL",
        variant: "destructive"
      });
      return;
    }

    const success = await updateDashboardLink(newDashboardLink);
    if (success) {
      toast({
        title: "Success",
        description: "Dashboard link updated successfully",
      });
      setNewDashboardLink('');
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

  return (
    <div className="space-y-6">
      {/* Manage Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Manage Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter dashboard URL (e.g., https://powerbi.com/dashboard)"
                value={newDashboardLink}
                onChange={(e) => setNewDashboardLink(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleUpdateDashboardLink}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Update Link
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {dashboardLink ? (
                <p>
                  Current dashboard link: <span className="text-primary font-medium">{dashboardLink}</span>
                </p>
              ) : (
                <p>No dashboard link set. Users will see the "Coming Soon" page.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Admin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Assign Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="flex-1"
              />
              <Select
                value={newUserRole}
                onValueChange={(value: UserRole) => setNewUserRole(value)}
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
              <Button onClick={handleAddUser}>
                <UserPlus className="w-4 h-4 mr-2" />
                Assign Role
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Assign a role to a user by their email. When they sign up with this email, they'll automatically have this role.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Existing Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            User Role Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={`${user.id}-${user.email}`} className="flex items-center justify-between p-4 border rounded-lg">
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
              <p className="text-center text-muted-foreground py-4">
                No role assignments found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
