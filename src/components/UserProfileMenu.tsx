
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, Key } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PasswordChangeModal } from './PasswordChangeModal';

interface UserProfileMenuProps {
  email: string;
}

export const UserProfileMenu = ({ email }: UserProfileMenuProps) => {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const { logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 hover:bg-primary/10">
            <User className="w-4 h-4" />
            <span className="text-sm">{email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem 
            onClick={() => setShowPasswordChange(true)}
            className="flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            Change Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="flex items-center gap-2 text-red-600"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PasswordChangeModal
        open={showPasswordChange}
        onOpenChange={setShowPasswordChange}
      />
    </>
  );
};
