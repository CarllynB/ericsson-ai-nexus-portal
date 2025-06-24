
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ExternalLink, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useDashboardLink } from '@/hooks/useDashboardLink';

export const DashboardManagement = () => {
  const { dashboardLink, updateDashboardLink } = useDashboardLink();
  const [newDashboardLink, setNewDashboardLink] = useState('');
  const { toast } = useToast();

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Dashboard Management
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
  );
};
