
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

interface PasswordChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFirstLogin?: boolean;
}

export const PasswordChangeModal = ({ open, onOpenChange, isFirstLogin = false }: PasswordChangeModalProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { changePassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    await changePassword(newPassword);
    setLoading(false);

    setNewPassword('');
    setConfirmPassword('');
    onOpenChange(false);
  };

  // Don't show the modal in offline mode
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Password Change Not Available
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Password changes are not available in offline mode. Your current credentials will continue to work.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>
              OK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
