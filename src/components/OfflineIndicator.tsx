
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
      <Database className="w-3 h-3 mr-1" />
      SQLite Mode
    </Badge>
  );
};
