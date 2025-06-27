
import { useEffect } from 'react';
import { populateDefaultAgents } from '@/utils/populateAgents';

export const useInitializeApp = () => {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        await populateDefaultAgents();
        console.log('App initialization complete');
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);
};
