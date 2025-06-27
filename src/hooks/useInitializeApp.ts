
import { useEffect, useState } from 'react';
import { populateAgents } from '@/utils/populateAgents';

export const useInitializeApp = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      // Check if agents have been populated
      const agentsPopulated = localStorage.getItem('agents_populated');
      
      if (!agentsPopulated) {
        const success = await populateAgents();
        if (success) {
          localStorage.setItem('agents_populated', 'true');
        }
      }
      
      setInitialized(true);
    };

    initializeApp();
  }, []);

  return { initialized };
};
