
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface DashboardSettings {
  dashboard_url: string | null;
}

export const useDashboardLink = () => {
  const [dashboardLink, setDashboardLink] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardLink = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_settings')
        .select('dashboard_url')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching dashboard link:', error);
        return;
      }

      const settings = data as DashboardSettings | null;
      if (settings?.dashboard_url) {
        setDashboardLink(settings.dashboard_url);
      }
    } catch (error) {
      console.error('Error in fetchDashboardLink:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDashboardLink = async (newLink: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('dashboard_settings')
        .upsert({
          id: 1,
          dashboard_url: newLink,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating dashboard link:', error);
        toast({
          title: "Error",
          description: "Failed to update dashboard link",
          variant: "destructive"
        });
        return false;
      }

      setDashboardLink(newLink);
      return true;
    } catch (error) {
      console.error('Error updating dashboard link:', error);
      toast({
        title: "Error",
        description: "Failed to update dashboard link",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchDashboardLink();
  }, []);

  return {
    dashboardLink,
    loading,
    updateDashboardLink,
    fetchDashboardLink
  };
};
