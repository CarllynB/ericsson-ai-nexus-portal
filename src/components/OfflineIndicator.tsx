
import React from 'react';
import { useOffline } from '@/hooks/useOffline';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { isOffline } = useOffline();

  if (!isOffline) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <Wifi className="w-3 h-3 mr-1" />
        Online
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
      <WifiOff className="w-3 h-3 mr-1" />
      Offline Mode
    </Badge>
  );
};
